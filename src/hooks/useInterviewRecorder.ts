import { useState, useRef, useCallback } from 'react';

interface UseInterviewRecorderProps {
  stream: MediaStream | null;
}

export function useInterviewRecorder({ stream }: UseInterviewRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(() => {
    if (!stream) {
      console.error('[Recorder] ❌ No stream available to record');
      return;
    }

    // Check if stream is active
    if (!stream.active) {
        console.error('[Recorder] ❌ Stream is inactive');
        return;
    }
    
    // Check tracks
    const audioTracks = stream.getAudioTracks();
    const videoTracks = stream.getVideoTracks();
    console.log(`[Recorder] Stream stats: ${audioTracks.length} audio, ${videoTracks.length} video`);

    try {
      // Prioritize codecs: VP9 (better quality) -> VP8 (compatibility) -> Default
      const mimeType = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ].find(type => MediaRecorder.isTypeSupported(type)) || '';

      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      
      const recorder = new MediaRecorder(stream, options);
      
      chunksRef.current = []; // Reset chunks

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          // console.log(`[Recorder] Chunk received: ${event.data.size} bytes`); // Verbose
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
        console.log(`[Recorder] 🛑 Recording finished. Total Size: ${fullBlob.size} bytes. Chunks: ${chunksRef.current.length}`);
        setRecordedBlob(fullBlob);
      };

      recorder.start(1000); // Collect 1s chunks
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      console.log(`[Recorder] ✅ Started recording. MimeType: ${mimeType || 'default'}`);

    } catch (err) {
      console.error('[Recorder] ❌ Failed to start:', err);
    }
  }, [stream]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      setIsRecording(false);
    }
  }, []);

  return {
    isRecording,
    recordedBlob,
    startRecording,
    stopRecording,
    // Helper to download for debugging if needed
    downloadRecording: () => {
      if (!recordedBlob) return;
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
}
