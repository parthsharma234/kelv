import React from 'react';
import { motion } from 'framer-motion';

interface AIInterviewerProps {
    isActive: boolean;
    isSpeaking: boolean;
    isListening: boolean;
    isProcessing: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showStatus?: boolean;
}

const AIInterviewer: React.FC<AIInterviewerProps> = ({
    isActive,
    isSpeaking,
    isListening,
    isProcessing,
    size = 'md',
    showStatus = false
}) => {
    const sizeClasses = {
        sm: 'w-16 h-16',
        md: 'w-24 h-24',
        lg: 'w-32 h-32',
        xl: 'w-48 h-48',
        full: 'w-64 h-64'
    };

    // Determine current state for animations
    const isIdle = isActive && !isSpeaking && !isListening && !isProcessing;
    const showStatusLabel = showStatus && (isSpeaking || isListening || isProcessing);

    return (
        <div className="flex flex-col items-center justify-center gap-6">
            {/* Main Avatar Container */}
            <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>

                {/* Outer Glow Ring - Always present but subtle when idle */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(251,146,60,0.15) 0%, transparent 70%)',
                    }}
                    animate={{
                        scale: isSpeaking ? [1, 1.4, 1] : isListening ? [1, 1.2, 1] : [1, 1.1, 1],
                        opacity: isSpeaking ? [0.6, 0.9, 0.6] : isListening ? [0.4, 0.7, 0.4] : [0.2, 0.35, 0.2]
                    }}
                    transition={{
                        duration: isSpeaking ? 0.8 : isListening ? 1.2 : 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Secondary Pulse Ring - Only when speaking */}
                {isSpeaking && (
                    <motion.div
                        className="absolute inset-0 rounded-full border-2 border-orange-500/40"
                        animate={{
                            scale: [1, 1.6],
                            opacity: [0.5, 0]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeOut"
                        }}
                    />
                )}

                {/* Listening Indicator - Stable glow + outer ripple */}
                {isListening && (
                    <>
                        {/* Constant inner glow */}
                        <motion.div
                            className="absolute inset-0 rounded-full bg-green-500/20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />
                        {/* Single slow ripple */}
                        <motion.div
                            className="absolute inset-0 rounded-full border-2 border-green-400/40"
                            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                        />
                    </>
                )}

                {/* Processing Spinner */}
                {isProcessing && (
                    <motion.div
                        className="absolute -inset-3 rounded-full"
                        style={{
                            border: '2px solid transparent',
                            borderTopColor: 'rgba(251,146,60,0.6)',
                            borderRightColor: 'rgba(251,146,60,0.3)',
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                )}


                {/* Core Logo with breathing animation */}
                <motion.div
                    className="z-10 w-full h-full relative"
                    animate={{
                        scale: isSpeaking ? [1, 1.05, 1] : isIdle ? [1, 1.02, 1] : 1,
                    }}
                    transition={{
                        duration: isSpeaking ? 0.6 : 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <img
                        src="/logo.svg"
                        alt="AI Interviewer"
                        className="w-full h-full object-contain"
                        style={{
                            filter: `drop-shadow(0 0 ${isSpeaking ? '20px' : isListening ? '15px' : '8px'} rgba(251,146,60,${isSpeaking ? '0.5' : isListening ? '0.35' : '0.2'}))`
                        }}
                    />
                </motion.div>
            </div>

            {/* Status Label - Only show during active states */}
            {showStatusLabel && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10"
                >
                    {/* Animated dot */}
                    <motion.span
                        className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-orange-500' :
                            isListening ? 'bg-green-500' :
                                'bg-yellow-500'
                            }`}
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="text-sm font-medium text-white/80">
                        {isProcessing ? 'Thinking' : isSpeaking ? 'Speaking' : 'Listening'}
                    </span>
                </motion.div>
            )}
        </div>
    );
};

export default AIInterviewer;

