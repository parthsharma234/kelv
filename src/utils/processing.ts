import { supabase } from '../lib/supabase';
import { InterviewProcessingStatus } from '../types/processing';

interface UpdateProcessingStatusParams {
  session_id: string;
  status: InterviewProcessingStatus;
  progress?: number;
  error?: string;
}

export async function updateInterviewProcessingStatus({
  session_id,
  status,
  progress,
  error
}: UpdateProcessingStatusParams) {
  const updates = {
    processing_status: status,
    processing_metadata: {
      progress,
      last_update: new Date().toISOString(),
      error
    }
  };

  try {
    const { data, error: dbError } = await supabase
      .from('realtime_interview_sessions')
      .update(updates)
      .eq('session_id', session_id)
      .single();

    if (dbError) throw dbError;
    return data;
  } catch (err) {
    console.error('Error updating processing status:', err);
    throw err;
  }
}

// Helper function to check if a session is still processing
export async function checkInterviewProcessingStatus(session_id: string) {
  try {
    const { data, error } = await supabase
      .from('realtime_interview_sessions')
      .select('processing_status, processing_metadata')
      .eq('session_id', session_id)
      .single();

    if (error) throw error;
    return {
      status: data.processing_status as InterviewProcessingStatus,
      progress: data.processing_metadata?.progress,
      error: data.processing_metadata?.error
    };
  } catch (err) {
    console.error('Error checking processing status:', err);
    throw err;
  }
}
