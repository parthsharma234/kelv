import React, { useState, useRef } from 'react';
import { ArrowLeft, Mic, Send, Volume2 } from 'lucide-react';
import { synthesizeSpeechWithElevenLabs, isElevenLabsTTSAvailable } from '../../utils/elevenLabsTTS';

interface CustomDemoInterviewProps {
  onBack: () => void;
}

const HARDCODED_AI_RESPONSES = [
  "Welcome to the KelvAI demo! I'm your AI interviewer. Let's get started.",
  "Tell me about your product and what makes it unique.",
  "That's impressive! How do you see this technology impacting your industry?",
  "Thank you for sharing. This concludes our demo interview."
];

export const CustomDemoInterview: React.FC<CustomDemoInterviewProps> = ({ onBack }) => {
  const [aiIndex, setAiIndex] = useState(0);
  const [transcript, setTranscript] = useState<{ speaker: 'user' | 'ai'; text: string }[]>([
    { speaker: 'ai', text: HARDCODED_AI_RESPONSES[0] }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasTTS = isElevenLabsTTSAvailable();

  // Play the current AI response with TTS
  const playAIResponse = async (text: string) => {
    setIsAISpeaking(true);
    if (hasTTS) {
      const audio = await synthesizeSpeechWithElevenLabs(text);
      if (audio) {
        audioRef.current = audio;
        audio.onended = () => setIsAISpeaking(false);
        audio.play();
      } else {
        setIsAISpeaking(false);
      }
    } else {
      setIsAISpeaking(false);
    }
  };

  // Play the first AI message on mount
  React.useEffect(() => {
    playAIResponse(HARDCODED_AI_RESPONSES[0]);
    // eslint-disable-next-line
  }, []);

  const handleUserSend = async () => {
    if (!userInput.trim() || isAISpeaking) return;
    const nextIndex = aiIndex + 1;
    setTranscript(prev => [
      ...prev,
      { speaker: 'user', text: userInput },
      nextIndex < HARDCODED_AI_RESPONSES.length
        ? { speaker: 'ai', text: HARDCODED_AI_RESPONSES[nextIndex] }
        : null
    ].filter(Boolean) as any);
    setUserInput('');
    if (nextIndex < HARDCODED_AI_RESPONSES.length) {
      setAiIndex(nextIndex);
      await playAIResponse(HARDCODED_AI_RESPONSES[nextIndex]);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUserSend();
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col pt-20">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <span className="text-white font-medium">
            🎤 KelvAI Demo Interview
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-xl">
          <div className="bg-dark-800 rounded-xl p-6 mb-6 border border-dark-700 min-h-[300px]">
            <div className="space-y-4">
              {transcript.map((msg, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className={`font-bold ${msg.speaker === 'user' ? 'text-blue-400' : 'text-orange-400'}`}>{msg.speaker === 'user' ? 'You' : 'AI'}:</span>
                  <span className="text-gray-200">{msg.text}</span>
                  {msg.speaker === 'ai' && idx === transcript.length - 1 && isAISpeaking && (
                    <Volume2 className="w-4 h-4 text-orange-400 animate-pulse ml-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-4 py-3 rounded-lg bg-dark-700 text-white border border-dark-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Type your response..."
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={isAISpeaking || aiIndex >= HARDCODED_AI_RESPONSES.length - 1}
            />
            <button
              onClick={handleUserSend}
              className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
              disabled={isAISpeaking || aiIndex >= HARDCODED_AI_RESPONSES.length - 1}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {aiIndex >= HARDCODED_AI_RESPONSES.length - 1 && (
            <div className="mt-6 text-center text-green-400 font-semibold">Demo complete! Thank you for trying KelvAI.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomDemoInterview; 