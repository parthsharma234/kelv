import React, { useState } from 'react';
import { Clock, ArrowLeft, MessageSquare, Send } from 'lucide-react';
import RealtimeTranscript from './RealtimeTranscript';
import AIInterviewer from '../AIInterviewer';
import { synthesizeSpeechWithElevenLabs } from '../../utils/elevenLabsTTS';

// Hardcoded script for the AI interviewer
const SCRIPT = [
  {
    speaker: 'assistant',
    text: "Hi! Thanks for making time to chat with me.",
  },
  {
    speaker: 'user',
    text: 'Nice to meet you! I\'m Felix!', // User will fill this in
  },
  {
    speaker: 'assistant',
    text: "Nice to meet you too! Can you tell me a bit about your past experiences in the tech industry?",
  },
  {
    speaker: 'user',
    text: 'I like computer science, and I’m building a platform to help people prepare for interviews. We build using custom AI models, React and Typescript, and',
  },
  {
    speaker: 'assistant',
    text: "Wow Felix. That's really cool! Tell me more about your platform, and why you've been building it?",
  },
  {
    speaker: 'user',
    text: 'I was motivated to pursue my current goals because I wanted to work at Google.',
  },
  {
    speaker: 'assistant',
    text: "Thank you for sharing! That wraps up our demo interview. Would you like to try again or return to the dashboard?",
  },
];

function getTimestamp(index: number) {
  // Fake timestamps for transcript ordering
  return Date.now() + index * 1000;
}

const HardcodedInterviewSession: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [step, setStep] = useState(0);
  const [isTranscriptCollapsed, setIsTranscriptCollapsed] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(true);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Hotkey to toggle button visibility (press 'b')
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'b') {
        setButtonVisible(v => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Play TTS for assistant messages when step changes and it's an AI message
  React.useEffect(() => {
    let cancelled = false;
    const playAI = async () => {
      const currentMsg = SCRIPT[step];
      if (!currentMsg || currentMsg.speaker !== 'assistant') return;
      setIsAISpeaking(true);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Use Bella for the specific message, Rachel otherwise
      const bellaText = "Wow Felix, that's really cool! Tell me more about your platform, and why you've been building it?";
      const voiceId = currentMsg.text.trim() === bellaText ? 'exAVe9wX6FQ6PzWQK2qD' : '21m00Tcm4TlvDq8ikWAM';
      const audio = await synthesizeSpeechWithElevenLabs(currentMsg.text, voiceId);
      if (cancelled) return;
      if (audio) {
        audioRef.current = audio;
        audio.play();
        audio.onended = () => setIsAISpeaking(false);
      } else {
        setIsAISpeaking(false);
      }
    };
    playAI();
    return () => {
      cancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsAISpeaking(false);
    };
  }, [step]);

  // Build transcript for display
  const transcript = SCRIPT.slice(0, step + 1).map((msg, idx) => ({
    id: `${msg.speaker}-${idx}`,
    speaker: msg.speaker as 'user' | 'assistant',
    text: msg.text,
    timestamp: getTimestamp(idx),
    isPartial: false,
  })).filter(chunk => chunk.text);

  const isUserTurn = SCRIPT[step]?.speaker === 'user';
  const isAITurn = SCRIPT[step]?.speaker === 'assistant';
  const currentQuestion = isAITurn ? SCRIPT[step].text : undefined;
  const questionCount = Math.floor(step / 2) + 1;

  // Progress to next message (button handler)
  const handleNext = () => {
    if (step < SCRIPT.length - 1 && !isAISpeaking) {
      setStep(step + 1);
    }
  };

  // Go back one message (button handler)
  const handleBackOne = () => {
    if (step > 0 && !isAISpeaking) {
      setStep(step - 1);
    }
  };

  const handleRestart = () => {
    setStep(0);
  };

  // Timer logic (optional, can be improved)
  const [duration, setDuration] = useState(0);
  React.useEffect(() => {
    if (step >= SCRIPT.length - 1) return;
    const interval = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, [step]);

  // UI
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="w-3 h-3 bg-[#FF5722] rounded-full animate-pulse"></div>
          <span className="text-white font-medium">
            Voice Interview
          </span>
          <div className="px-2 py-1 bg-[#FF5722]/20 rounded text-[#FF5722] text-xs font-medium border border-[#FF5722]/30">
            Tech
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#FF5722]" />
            <span className="text-white font-medium">
              {String(Math.floor(duration / 60)).padStart(2, '0')}:{String(duration % 60).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden h-full">
        {/* Left side - Realtime transcript */}
        <RealtimeTranscript
          transcript={transcript}
          isCollapsed={isTranscriptCollapsed}
          onToggleCollapse={() => setIsTranscriptCollapsed(!isTranscriptCollapsed)}
          isAISpeaking={isAISpeaking}
          isUserSpeaking={isUserTurn}
        />
        {/* Right side - Video area with current question overlay */}
        <div className="flex-1 relative bg-gray-900">
          {/* Current question overlay - top right */}
          {currentQuestion && (
            <div className="absolute top-6 right-6 max-w-md bg-gray-900/95 backdrop-blur-sm rounded-xl p-4 border border-[#FF5722]/20 z-20">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#FF5722] flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-medium text-sm mb-2">Current Question</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{currentQuestion}</p>
                  <div className="mt-2">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-[#FF5722]/20 text-[#FF5722] border border-[#FF5722]/30">
                      Question {questionCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Main video area */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AIInterviewer 
              isActive={true}
              isSpeaking={isAISpeaking}
              isListening={isUserTurn}
              isProcessing={false}
              size="xl"
              showStatus={true}
            />
          </div>
          {/* Progress button (hideable, floating bottom right) */}
          {buttonVisible && step < SCRIPT.length - 1 && (
            <button
              onClick={handleNext}
              disabled={isAISpeaking}
              className="fixed bottom-8 right-8 z-50 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-2xl font-bold text-lg shadow-lg hover:from-orange-400 hover:to-orange-300 transition-all focus:outline-none focus:ring-4 focus:ring-orange-400/40 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Next
            </button>
          )}
          {/* Back button (hideable, floating bottom left) */}
          {buttonVisible && step > 0 && (
            <button
              onClick={handleBackOne}
              disabled={isAISpeaking}
              className="fixed bottom-8 left-8 z-50 px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:from-gray-500 hover:to-gray-400 transition-all focus:outline-none focus:ring-4 focus:ring-gray-400/40 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Back
            </button>
          )}
          {/* End of script controls */}
          {step >= SCRIPT.length - 1 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/70">
              <div className="bg-gray-900/95 rounded-2xl p-8 max-w-md w-full mx-6 border border-gray-800 shadow-2xl backdrop-blur-sm text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Demo Complete</h2>
                <p className="text-gray-300 mb-6">You've reached the end of the scripted interview. Would you like to try again or return to the dashboard?</p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleRestart}
                    className="px-6 py-3 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] transition-colors font-medium"
                  >
                    Restart Demo
                  </button>
                  <button
                    onClick={onBack}
                    className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HardcodedInterviewSession; 