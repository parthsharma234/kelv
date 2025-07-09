import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { TranscriptChunk } from '../../utils/openaiRealtime';
import RedPandaLogo from '../RedPandaLogo';

interface RealtimeTranscriptProps {
  transcript: TranscriptChunk[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isAISpeaking: boolean;
  isUserSpeaking: boolean;
}

const RealtimeTranscript: React.FC<RealtimeTranscriptProps> = ({
  transcript,
  isCollapsed,
  onToggleCollapse,
  isAISpeaking,
  isUserSpeaking
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, autoScroll]);

  // Check if user has scrolled up to disable auto-scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setAutoScroll(isAtBottom);
  };

  // Format timestamp for display
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Combine and sort all transcript chunks by timestamp
  const combinedTranscript = [...transcript].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div 
      className={`bg-gray-900/95 backdrop-blur-sm border-r border-gray-800 flex flex-col transition-all duration-300 h-full max-h-screen ${
        isCollapsed ? 'w-12' : 'w-[28rem]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-5 h-5 text-[#FF5722]" />
            <h3 className="text-white font-medium">Live Transcript</h3>
          </div>
        )}
        
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          title={isCollapsed ? 'Expand transcript' : 'Collapse transcript'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* Transcript content */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col min-h-0 max-h-full overflow-hidden">
          {/* Minimal status indicator */}
          {(isAISpeaking || isUserSpeaking) && (
            <div className="px-3 py-2 border-b border-gray-800/30 flex-shrink-0">
              <div className="flex items-center space-x-2 text-xs">
                {isAISpeaking && (
                  <div className="flex items-center space-x-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF5722] animate-pulse" />
                    <span className="text-[#FF5722]">Kelv speaking</span>
                  </div>
                )}
                {isUserSpeaking && (
                  <div className="flex items-center space-x-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-blue-500">You speaking</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transcript messages */}
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0"
          >
            {combinedTranscript.length === 0 ? (
              <div className="text-center text-gray-500 mt-12">
                <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Conversation will appear here</p>
              </div>
            ) : (
              combinedTranscript.map((chunk, index) => (
                <div key={chunk.id || `chunk-${index}`} className={`flex items-end gap-2 ${chunk.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {chunk.speaker === 'assistant' && (
                    <div className="w-8 h-8 flex-shrink-0">
                      <RedPandaLogo size="sm" animate={isAISpeaking && chunk.isPartial} />
                    </div>
                  )}
                  <div 
                    className={`max-w-xs md:max-w-md rounded-2xl px-4 py-2.5 ${
                      chunk.speaker === 'assistant' 
                        ? 'bg-dark-800 text-gray-200 rounded-bl-lg' 
                        : 'bg-orange-600 text-white rounded-br-lg'
                    } ${chunk.isPartial ? 'opacity-70' : ''}`}
                  >
                    <p className="text-sm leading-relaxed">
                      {chunk.text}
                      {chunk.isPartial && <span className="inline-block w-1 h-3 bg-gray-400 ml-1 animate-pulse" />}
                    </p>
                  </div>
                  {chunk.speaker === 'user' && (
                     <div className="w-8 h-8 flex-shrink-0 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-400" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Simplified auto-scroll indicator */}
          {!autoScroll && (
            <div className="px-3 py-1.5 border-t border-gray-800/30">
              <button
                onClick={() => {
                  setAutoScroll(true);
                  if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                  }
                }}
                className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors py-1"
              >
                ↓ Scroll to latest
              </button>
            </div>
          )}
        </div>
      )}

      {/* Collapsed state indicator */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-6">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          
          {/* Minimal status dots when collapsed */}
          <div className="space-y-2">
            <div className={`w-2 h-2 rounded-full mx-auto ${
              isAISpeaking ? 'bg-[#FF5722] animate-pulse' : 'bg-gray-700'
            }`} title="Kelv Speaking" />
            <div className={`w-2 h-2 rounded-full mx-auto ${
              isUserSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-700'
            }`} title="You Speaking" />
          </div>

          {/* Message count indicator - more subtle */}
          {transcript.length > 0 && (
            <div className="bg-gray-700 text-gray-300 text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
              {Math.min(transcript.filter(chunk => !chunk.isPartial).length, 9)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealtimeTranscript;
