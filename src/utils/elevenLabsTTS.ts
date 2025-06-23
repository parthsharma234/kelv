// ElevenLabs Text-to-Speech utility using Mark voice with Flash v2.5 model for professional interviews
const ELEVEN_LABS_API_KEY = import.meta.env.VITE_ELEVEN_LABS_API_KEY;

// Mark's voice ID - professional, clear American male voice perfect for interviews
const MARK_VOICE_ID = 'flq6f7yk4E4fJM5XTYuZ';

/**
 * Synthesize speech using ElevenLabs TTS API with Mark (professional American male voice) and Flash v2.5
 * @param text - The text to convert to speech
 * @returns Promise<HTMLAudioElement | null>
 */
export const synthesizeSpeechWithElevenLabs = async (
  text: string
): Promise<HTMLAudioElement | null> => {
  if (!ELEVEN_LABS_API_KEY || ELEVEN_LABS_API_KEY === 'your_elevenlabs_api_key_here') {
    console.warn('ElevenLabs API key not configured');
    return null;
  }

  try {    const requestBody = {
      text,
      model_id: 'eleven_flash_v2_5', // Latest Flash v2.5 model - faster and more natural
      voice_settings: {
        stability: 0.7, // Higher stability for professional delivery
        similarity_boost: 0.9, // High similarity for consistent voice
        style: 0.1, // Minimal style for clear, professional speech
        use_speaker_boost: true // Enhanced clarity for interviews
      }
    };

    console.log('Synthesizing speech with ElevenLabs Flash v2.5 (Mark):', text.substring(0, 50) + '...');

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${MARK_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVEN_LABS_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Error:', response.status, errorText);
      throw new Error(`ElevenLabs TTS API error: ${response.status}`);
    }

    // Get the audio data as a blob
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Clean up URL when audio is loaded
    audio.addEventListener('loadeddata', () => {
      URL.revokeObjectURL(audioUrl);
    });

    return audio;
  } catch (error) {
    console.error('Error synthesizing speech with ElevenLabs:', error);
    return null;
  }
};

/**
 * Check if ElevenLabs TTS is available
 * @returns boolean
 */
export const isElevenLabsTTSAvailable = (): boolean => {
  return !!(ELEVEN_LABS_API_KEY && ELEVEN_LABS_API_KEY !== 'your_elevenlabs_api_key_here');
};
