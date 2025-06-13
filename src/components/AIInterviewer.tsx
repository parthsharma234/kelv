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

  // Eye blink animation
  const blinkAnimation = {
    scaleY: [1, 0.1, 1],
    transition: {
      duration: 0.2,
      repeat: Infinity,
      repeatDelay: Math.random() * 4 + 2,
      ease: "easeInOut"
    }
  };

  // Ear twitch animation
  const earTwitchAnimation = {
    rotate: [0, 5, 0, -3, 0],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: Math.random() * 8 + 3,
      ease: "easeInOut"
    }
  };

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
        
        <svg viewBox="0 0 120 120" className="w-full h-full relative z-10">
          <defs>
            <filter id="aiGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <radialGradient id="aiFaceGradient" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FF6B35" />
              <stop offset="100%" stopColor="#FF5722" />
            </radialGradient>
            <radialGradient id="aiEarGradient" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFE4B5" />
              <stop offset="100%" stopColor="#F5DEB3" />
            </radialGradient>
          </defs>
          
          {/* Main head circle */}
          <circle 
            cx="60" 
            cy="60" 
            r="35" 
            fill="url(#aiFaceGradient)"
            filter="url(#aiGlow)"
          />
          
          {/* Ears with twitch animation */}
          <motion.g animate={earTwitchAnimation}>
            <ellipse cx="40" cy="35" rx="8" ry="12" fill="url(#aiEarGradient)" transform="rotate(-20 40 35)" />
            <ellipse cx="40" cy="35" rx="4" ry="8" fill="#2D3748" transform="rotate(-20 40 35)" />
          </motion.g>
          
          <motion.g animate={{...earTwitchAnimation, transition: {...earTwitchAnimation.transition, delay: 0.2}}}>
            <ellipse cx="80" cy="35" rx="8" ry="12" fill="url(#aiEarGradient)" transform="rotate(20 80 35)" />
            <ellipse cx="80" cy="35" rx="4" ry="8" fill="#2D3748" transform="rotate(20 80 35)" />
          </motion.g>
          
          {/* Face markings */}
          <ellipse cx="60" cy="70" rx="22" ry="16" fill="#FFE4B5" />
          <ellipse cx="60" cy="73" rx="17" ry="12" fill="#F5DEB3" />
          
          {/* Eye patches */}
          <ellipse cx="50" cy="53" rx="9" ry="11" fill="#2D3748" transform="rotate(-10 50 53)" />
          <ellipse cx="70" cy="53" rx="9" ry="11" fill="#2D3748" transform="rotate(10 70 53)" />
          
          {/* Eyes with blinking */}
          <motion.ellipse 
            cx="50" 
            cy="53" 
            rx="4" 
            ry="5" 
            fill="white"
            animate={blinkAnimation}
          />
          <motion.ellipse 
            cx="70" 
            cy="53" 
            rx="4" 
            ry="5" 
            fill="white"
            animate={{...blinkAnimation, transition: {...blinkAnimation.transition, delay: 0.1}}}
          />
          
          {/* Pupils */}
          <circle cx="50" cy="54" r="2" fill="#2D3748" />
          <circle cx="70" cy="54" r="2" fill="#2D3748" />
          
          {/* Eye highlights */}
          <circle cx="51" cy="53" r="0.8" fill="white" />
          <circle cx="71" cy="53" r="0.8" fill="white" />
          
          {/* Nose */}
          <ellipse cx="60" cy="63" rx="2.5" ry="2" fill="#2D3748" />
          
          {/* Mouth - changes based on state */}
          {isSpeaking ? (
            <motion.ellipse 
              cx="60" 
              cy="68" 
              rx="3" 
              ry="2" 
              fill="#2D3748"
              animate={{
                ry: [2, 3, 2],
                transition: { duration: 0.3, repeat: Infinity }
              }}
            />
          ) : (
            <path 
              d="M 60 65 Q 57 67 54 65 M 60 65 Q 63 67 66 65" 
              stroke="#2D3748" 
              strokeWidth="2" 
              fill="none" 
              strokeLinecap="round"
            />
          )}
        </svg>
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