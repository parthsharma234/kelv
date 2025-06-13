import React from 'react';
import { motion } from 'framer-motion';

interface RedPandaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  className?: string;
}

const RedPandaLogo: React.FC<RedPandaLogoProps> = ({ 
  size = 'md', 
  animate = true,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const breathingAnimation = animate ? {
    scale: [1, 1.05, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  const blinkAnimation = animate ? {
    scaleY: [1, 0.1, 1],
    transition: {
      duration: 0.3,
      repeat: Infinity,
      repeatDelay: 3,
      ease: "easeInOut"
    }
  } : {};

  return (
    <motion.div 
      className={`${sizeClasses[size]} ${className} relative`}
      animate={breathingAnimation}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Outer glow */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <radialGradient id="faceGradient" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FF6B35" />
            <stop offset="100%" stopColor="#FF5722" />
          </radialGradient>
          <radialGradient id="earGradient" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFE4B5" />
            <stop offset="100%" stopColor="#F5DEB3" />
          </radialGradient>
        </defs>
        
        {/* Main head circle */}
        <circle 
          cx="50" 
          cy="55" 
          r="35" 
          fill="url(#faceGradient)"
          filter="url(#glow)"
        />
        
        {/* Ears */}
        <ellipse cx="35" cy="30" rx="8" ry="12" fill="url(#earGradient)" transform="rotate(-20 35 30)" />
        <ellipse cx="65" cy="30" rx="8" ry="12" fill="url(#earGradient)" transform="rotate(20 65 30)" />
        <ellipse cx="35" cy="30" rx="4" ry="8" fill="#2D3748" transform="rotate(-20 35 30)" />
        <ellipse cx="65" cy="30" rx="4" ry="8" fill="#2D3748" transform="rotate(20 65 30)" />
        
        {/* Face markings */}
        <ellipse cx="50" cy="65" rx="20" ry="15" fill="#FFE4B5" />
        <ellipse cx="50" cy="68" rx="15" ry="10" fill="#F5DEB3" />
        
        {/* Eye patches */}
        <ellipse cx="42" cy="48" rx="8" ry="10" fill="#2D3748" transform="rotate(-10 42 48)" />
        <ellipse cx="58" cy="48" rx="8" ry="10" fill="#2D3748" transform="rotate(10 58 48)" />
        
        {/* Eyes */}
        <motion.ellipse 
          cx="42" 
          cy="48" 
          rx="3" 
          ry="4" 
          fill="white"
          animate={blinkAnimation}
        />
        <motion.ellipse 
          cx="58" 
          cy="48" 
          rx="3" 
          ry="4" 
          fill="white"
          animate={blinkAnimation}
        />
        
        {/* Pupils */}
        <circle cx="42" cy="49" r="1.5" fill="#2D3748" />
        <circle cx="58" cy="49" r="1.5" fill="#2D3748" />
        
        {/* Eye highlights */}
        <circle cx="42.5" cy="48" r="0.5" fill="white" />
        <circle cx="58.5" cy="48" r="0.5" fill="white" />
        
        {/* Nose */}
        <ellipse cx="50" cy="58" rx="2" ry="1.5" fill="#2D3748" />
        
        {/* Mouth */}
        <path 
          d="M 50 60 Q 47 62 45 60 M 50 60 Q 53 62 55 60" 
          stroke="#2D3748" 
          strokeWidth="1.5" 
          fill="none" 
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
};

export default RedPandaLogo;