import { supabase } from '../lib/supabase';

export interface RecordingData {
  session_id: string;
  video_blob: Blob;
  duration: number;
  file_size: number;
  mime_type: string;
  metadata?: {
    setup?: any;
    questions_answered?: number;
    overall_score?: number;
    analysis_data?: any;
  };
}

export interface SavedRecording {
  id: string;
  session_id: string;
  video_url: string;
  duration: number;
  file_size: number;
  mime_type: string;
  metadata: any;
  created_at: string;
  user_id: string;
}

/**
 * Save interview recording to Supabase storage and database
 */
export async function saveInterviewRecording(recordingData: RecordingData): Promise<SavedRecording> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `interview-${recordingData.session_id}-${timestamp}.webm`;
    const filepath = `interview-recordings/${user.id}/${filename}`;

    // Upload video to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('interview-recordings')
      .upload(filepath, recordingData.video_blob, {
        contentType: recordingData.mime_type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload recording: ${uploadError.message}`);
    }

    // Get public URL for the uploaded video
    const { data: { publicUrl } } = supabase.storage
      .from('interview-recordings')
      .getPublicUrl(filepath);

    // Save recording metadata to database
    const recordingMetadata = {
      session_id: recordingData.session_id,
      user_id: user.id,
      video_url: publicUrl,
      storage_path: filepath,
      duration: recordingData.duration,
      file_size: recordingData.file_size,
      mime_type: recordingData.mime_type,
      metadata: recordingData.metadata || {},
      created_at: new Date().toISOString()
    };

    const { data: dbData, error: dbError } = await supabase
      .from('interview_recordings')
      .insert([recordingMetadata])
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Try to clean up the uploaded file if database insert fails
      try {
        await supabase.storage
          .from('interview-recordings')
          .remove([filepath]);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError);
      }
      throw new Error(`Failed to save recording metadata: ${dbError.message}`);
    }

    return dbData;
  } catch (error) {
    console.error('Error saving interview recording:', error);
    throw error;
  }
}

/**
 * Get saved interview recordings for the current user
 */
export async function getUserInterviewRecordings(limit: number = 20): Promise<SavedRecording[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('interview_recordings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recordings:', error);
      throw new Error(`Failed to fetch recordings: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error getting user interview recordings:', error);
    throw error;
  }
}

/**
 * Get a specific interview recording by session ID
 */
export async function getRecordingBySessionId(sessionId: string): Promise<SavedRecording | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('interview_recordings')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No recording found for this session
        return null;
      }
      console.error('Error fetching recording:', error);
      throw new Error(`Failed to fetch recording: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error getting recording by session ID:', error);
    throw error;
  }
}

/**
 * Delete an interview recording
 */
export async function deleteInterviewRecording(recordingId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // First get the recording to get the storage path
    const { data: recording, error: fetchError } = await supabase
      .from('interview_recordings')
      .select('storage_path')
      .eq('id', recordingId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch recording: ${fetchError.message}`);
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('interview-recordings')
      .remove([recording.storage_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('interview_recordings')
      .delete()
      .eq('id', recordingId)
      .eq('user_id', user.id);

    if (dbError) {
      throw new Error(`Failed to delete recording metadata: ${dbError.message}`);
    }
  } catch (error) {
    console.error('Error deleting interview recording:', error);
    throw error;
  }
}

/**
 * Create a MediaRecorder instance to record video from stream
 */
export function createVideoRecorder(stream: MediaStream): {
  recorder: MediaRecorder;
  startRecording: () => void;
  stopRecording: () => Promise<Blob>;
} {
  const chunks: Blob[] = [];
  
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9,opus'
  });

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const startRecording = () => {
    chunks.length = 0; // Clear previous chunks
    recorder.start(1000); // Collect data every second
  };

  const stopRecording = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      recorder.onerror = (error) => {
        reject(error);
      };

      if (recorder.state === 'recording') {
        recorder.stop();
      } else {
        // If not recording, create empty blob
        resolve(new Blob([], { type: 'video/webm' }));
      }
    });
  };

  return {
    recorder,
    startRecording,
    stopRecording
  };
}

/**
 * Get video duration from blob
 */
export function getVideoDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(blob);
  });
}