import React from 'react';
import { motion } from 'framer-motion';

interface AIInterviewerProps {
  isActive?: boolean;
  isSpeaking?: boolean;
  isListening?: boolean;
  isProcessing?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
}

const AIInterviewer: React.FC<AIInterviewerProps> = ({ 
  isActive = false,
  isSpeaking = false,
  isListening = false,
  isProcessing = false,
  size = 'lg',
  showStatus = true
}) => {
  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
    xl: 'w-80 h-80'
  };

  // Breathing animation - slower and more natural
  const breathingAnimation = {
    scale: [1, 1.02, 1],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  // Speaking animation - faster breathing when talking
  const speakingAnimation = isSpeaking ? {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : breathingAnimation;

  // Listening animation - subtle pulse
  const listeningAnimation = isListening ? {
    scale: [1, 1.03, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : speakingAnimation;

  // Processing animation - gentle glow
  const processingAnimation = isProcessing ? {
    scale: [1, 1.04, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : listeningAnimation;

  return (
    <div className="flex flex-col items-center">
      <motion.div 
        className={`${sizeClasses[size]} relative`}
        animate={processingAnimation}
      >
        {/* Background glow */}
        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
          isListening 
            ? 'bg-green-500/20 shadow-lg shadow-green-500/30' 
            : isSpeaking 
            ? 'bg-orange-500/20 shadow-lg shadow-orange-500/30'
            : isProcessing
            ? 'bg-blue-500/20 shadow-lg shadow-blue-500/30'
            : 'bg-orange-500/10'
        }`} />
        
        {/* Use the actual logo image */}
        <img 
          src="/logo.png" 
          alt="Kelv AI Interviewer" 
          className="w-full h-full object-contain relative z-10"
        />
      </motion.div>
      
      {/* Status indicator */}
      {showStatus && (
        <motion.div 
          className="mt-4 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            {isListening && (
              <motion.div 
                className="flex gap-1"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </motion.div>
            )}
            {isSpeaking && (
              <motion.div 
                className="flex gap-1"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              </motion.div>
            )}
            {isProcessing && (
              <motion.div 
                className="flex gap-1"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              </motion.div>
            )}
          </div>
          
          <span className={`text-sm font-medium ${
            isListening 
              ? 'text-green-400' 
              : isSpeaking 
              ? 'text-orange-400'
              : isProcessing
              ? 'text-blue-400'
              : 'text-gray-400'
          }`}>
            {isListening ? 'Listening...' : 
             isSpeaking ? 'Speaking...' : 
             isProcessing ? 'Processing...' :
             isActive ? 'Ready...' : 'AI Interviewer'}
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default AIInterviewer;