import { AssemblyAI } from 'assemblyai';

const ASSEMBLYAI_API_KEY = import.meta.env.VITE_ASSEMBLYAI_API_KEY || '';

const client = new AssemblyAI({
  apiKey: ASSEMBLYAI_API_KEY,
});

export const transcribeAudio = async (audioUrl: string) => {
  if (!ASSEMBLYAI_API_KEY) {
    console.error('AssemblyAI API key not configured');
    return null;
  }

  try {
    const transcript = await client.transcripts.create({
      audio_url: audioUrl,
      speech_model: 'nano',
      sentiment_analysis: true,
    });

    if (transcript.status === 'error') {
      console.error('Error transcribing audio:', transcript.error);
      return null;
    }

    return transcript;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return null;
  }
};
