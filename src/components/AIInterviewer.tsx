import React from 'react';
import { motion } from 'framer-motion';
import RedPandaLogo from './RedPandaLogo';

interface AIInterviewerProps {
  isActive?: boolean;
  isSpeaking?: boolean;
  isListening?: boolean;
  isProcessing?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement>;
}

const AIInterviewer: React.FC<AIInterviewerProps> = ({ 
  isActive = false,
  isSpeaking = false,
  isListening = false,
  isProcessing = false,
  size = 'lg',
  showStatus = true,
  videoRef
}) => {
  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
    xl: 'w-80 h-80'
  };

  // Enhanced breathing animation - more natural and realistic
  const breathingAnimation = {
    scale: [1, 1.03, 1],
    transition: {
      duration: 4.5,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  };

  // Speaking animation - faster breathing when talking
  const speakingAnimation = isSpeaking ? {
    scale: [1, 1.08, 1],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  } : breathingAnimation;

  // Listening animation - attentive pulse
  const listeningAnimation = isListening ? {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  } : speakingAnimation;

  // Processing animation - thoughtful glow
  const processingAnimation = isProcessing ? {
    scale: [1, 1.06, 1],
    transition: {
      duration: 1.8,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  } : listeningAnimation;

  return (
    <div className="flex flex-col items-center">
      <motion.div 
        className={`${sizeClasses[size]} relative`}
        animate={processingAnimation}
      >
        {/* Video element */}
        {videoRef && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute w-full h-full object-cover rounded-full z-0"
            style={{ transform: 'scaleX(-1)' }} // Mirror the video
          />
        )}

        {/* Overlay to darken the video a bit */}
        {videoRef && (
          <div className="absolute inset-0 bg-black opacity-30 rounded-full z-10"></div>
        )}

        {/* Background glow effect */}
        <motion.div 
          className={`absolute inset-0 rounded-full transition-all duration-500 ${
            isListening 
              ? 'bg-green-500/20 shadow-2xl shadow-green-500/40' 
              : isSpeaking 
              ? 'bg-orange-500/20 shadow-2xl shadow-orange-500/40'
              : isProcessing
              ? 'bg-blue-500/20 shadow-2xl shadow-blue-500/40'
              : 'bg-orange-500/10 shadow-lg shadow-orange-500/20'
          }`}
          animate={{
            opacity: isActive ? [0.7, 1, 0.7] : 0.5,
          }}
          transition={{
            duration: isListening ? 1.5 : isSpeaking ? 0.8 : 2,
            repeat: isActive ? Infinity : 0,
            ease: "easeInOut"
          }}
        />
        
        {/* Outer ring for enhanced effect */}
        <motion.div 
          className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${
            isListening 
              ? 'border-green-400/30' 
              : isSpeaking 
              ? 'border-orange-400/30'
              : isProcessing
              ? 'border-blue-400/30'
              : 'border-orange-400/20'
          }`}
          animate={{
            scale: isActive ? [1, 1.1, 1] : 1,
            opacity: isActive ? [0.3, 0.6, 0.3] : 0.2,
          }}
          transition={{
            duration: isListening ? 2 : isSpeaking ? 1 : 2.5,
            repeat: isActive ? Infinity : 0,
            ease: "easeInOut"
          }}
        />
        
        {/* Use the actual red panda logo with enhanced breathing */}
        <motion.div
          className="w-full h-full relative z-20"
          animate={{
            rotate: isProcessing ? [0, 2, -2, 0] : 0,
          }}
          transition={{
            duration: 4,
            repeat: isProcessing ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          <RedPandaLogo 
            size="xl" 
            animate={true}
            className="w-full h-full"
          />
        </motion.div>
      </motion.div>
      
      {/* Enhanced status indicator */}
      {showStatus && (
        <motion.div 
          className="mt-6 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            {isListening && (
              <motion.div 
                className="flex gap-1"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <motion.div 
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div 
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div 
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </motion.div>
            )}
            {isSpeaking && (
              <motion.div 
                className="flex gap-1"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <motion.div 
                  className="w-2 h-2 bg-orange-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 0.4, repeat: Infinity, delay: 0 }}
                />
                <motion.div 
                  className="w-2 h-2 bg-orange-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 0.4, repeat: Infinity, delay: 0.1 }}
                />
                <motion.div 
                  className="w-2 h-2 bg-orange-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 0.4, repeat: Infinity, delay: 0.2 }}
                />
              </motion.div>
            )}
            {isProcessing && (
              <motion.div 
                className="flex gap-1"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <motion.div 
                  className="w-2 h-2 bg-blue-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                />
                <motion.div 
                  className="w-2 h-2 bg-blue-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
                />
                <motion.div 
                  className="w-2 h-2 bg-blue-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.6 }}
                />
              </motion.div>
            )}
          </div>
          
          <motion.span 
            className={`text-sm font-medium ${
              isListening 
                ? 'text-green-400' 
                : isSpeaking 
                ? 'text-orange-400'
                : isProcessing
                ? 'text-blue-400'
                : 'text-gray-400'
            }`}
            animate={{
              opacity: isActive ? [0.7, 1, 0.7] : 1,
            }}
            transition={{
              duration: 2,
              repeat: isActive ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            {isListening ? 'Listening carefully...' : 
             isSpeaking ? 'Speaking...' : 
             isProcessing ? 'Thinking...' :
             isActive ? 'Ready to interview...' : 'AI Interviewer'}
          </motion.span>
        </motion.div>
      )}
    </div>
  );
};

export default AIInterviewer;