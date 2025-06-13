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

  return (
    <motion.div 
      className={`${sizeClasses[size]} ${className} relative`}
      animate={breathingAnimation}
    >
      <img 
        src="/logo.png" 
        alt="Kelv AI Logo" 
        className="w-full h-full object-contain"
      />
    </motion.div>
  );
};

export default RedPandaLogo;