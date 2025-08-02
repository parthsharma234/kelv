const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function synthesizeSpeechWithOpenAI(text: string, voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy'): Promise<HTMLAudioElement | null> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.warn('OpenAI API key not configured');
    return null;
  }
  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1', // or 'tts-1-hd' for higher quality
        input: text,
        voice,
        response_format: 'mp3'
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS API Error:', response.status, errorText);
      return null;
    }
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.addEventListener('loadeddata', () => {
      URL.revokeObjectURL(audioUrl);
    });
    return audio;
  } catch (error) {
    console.error('Error synthesizing speech with OpenAI TTS:', error);
    return null;
  }
} 