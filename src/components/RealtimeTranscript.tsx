// src/components/RealtimeTranscript.tsx
import React, { useEffect, useRef } from 'react';
import { TranscriptEntry } from '../hooks/useRealtimeInterview';

interface RealtimeTranscriptProps {
  transcript: TranscriptEntry[];
}

const RealtimeTranscript: React.FC<RealtimeTranscriptProps> = ({ transcript }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current;
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      });
    }
  }, [transcript]);

  return (
    <div 
      ref={scrollContainerRef}
      className="h-full overflow-y-auto space-y-4 pr-2 custom-scrollbar"
      style={{
        scrollBehavior: 'smooth'
      }}
    >
      {transcript.map((entry, index) => (
        <div 
          key={index} 
          className={`p-3 rounded-lg transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
            entry.speaker === 'user' 
              ? 'bg-[#FF5722]/10 border-l-4 border-[#FF5722] ml-4' 
              : 'bg-blue-500/10 border-l-4 border-blue-500 mr-4'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${
              entry.speaker === 'user' ? 'bg-[#FF5722]' : 'bg-blue-500'
            }`} />
            <span className={`text-xs font-medium uppercase tracking-wide ${
              entry.speaker === 'user' ? 'text-[#FF5722]' : 'text-blue-400'
            }`}>
              {entry.speaker === 'user' ? 'You' : 'AI Interviewer'}
            </span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            {entry.text}
          </p>
        </div>
      ))}
    </div>
  );
};

export default RealtimeTranscript;
