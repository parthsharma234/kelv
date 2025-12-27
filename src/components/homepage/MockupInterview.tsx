import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Video } from 'lucide-react';
import RedPandaLogo from '../RedPandaLogo';

/**
 * Simplified interview session mockup for homepage
 * Shows AI interviewer + live transcript animation
 */
const MockupInterview: React.FC = () => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(false);

    const transcript = [
        { role: 'ai', text: "Tell me about a time you had to lead a project under pressure." },
        { role: 'user', text: "At my previous role, I led a team of 5 engineers to deliver..." },
        { role: 'ai', text: "What was the biggest challenge you faced?" },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setIsTyping(true);
            setTimeout(() => {
                setCurrentMessageIndex((prev) => (prev + 1) % transcript.length);
                setIsTyping(false);
            }, 800);
        }, 4000);

        return () => clearInterval(interval);
    }, [transcript.length]);

    return (
        <div className="bg-[#030305] min-h-[350px] flex overflow-hidden">
            {/* Left: Transcript (Reverted to left) */}
            <div className="w-1/3 border-r border-white/5 p-4 flex flex-col pt-8">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">Live Transcript</span>
                </div>

                <div className="flex-1 space-y-4 overflow-hidden">
                    <AnimatePresence mode="popLayout">
                        {transcript.slice(0, currentMessageIndex + 1).map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0.5 }}
                                className="flex gap-3"
                            >
                                <span className={`text-[9px] font-bold uppercase mt-1 ${msg.role === 'ai' ? 'text-orange-400' : 'text-gray-400'}`}>
                                    {msg.role === 'ai' ? 'Kelv' : 'You'}
                                </span>
                                <p className="text-[11px] text-gray-300 leading-relaxed max-w-[90%] font-medium">
                                    {msg.text}
                                    {i === currentMessageIndex && isTyping && (
                                        <span className="inline-block w-1.5 h-3 bg-orange-400 ml-1 cursor-blink" />
                                    )}
                                </p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Middle: AI Interviewer */}
            <div className="w-1/3 flex flex-col items-center justify-center p-4">
                <div className="flex-1 flex items-center justify-center relative">
                    <motion.div
                        className="absolute w-32 h-32 rounded-full border border-dark-700"
                        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.1, 0.2] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    />

                    <motion.div
                        className="relative z-10"
                        animate={{ scale: isTyping ? [1, 1.05, 1] : 1 }}
                        transition={{ duration: 0.5, repeat: isTyping ? Infinity : 0 }}
                    >
                        <RedPandaLogo size="xl" animate={isTyping} />
                    </motion.div>
                </div>

                <div className="flex gap-2 mt-4">
                    <div className="p-1.5 rounded-lg bg-white/5">
                        <Mic className="w-3 h-3 text-white" />
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/5">
                        <Video className="w-3 h-3 text-white" />
                    </div>
                </div>
            </div>

            {/* Right: Vertical Metrics (Voice Analysis) */}
            <div className="w-[110px] p-4 flex flex-col justify-center gap-8 border-l border-white/5 bg-dark-900/40">
                <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-wider text-gray-500">Confidence</p>
                    <p className="text-base font-semibold text-white">78%</p>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-green-500"
                            initial={{ width: 0 }}
                            animate={{ width: "78%" }}
                            transition={{ duration: 1.5, delay: 1 }}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-wider text-gray-500">Pace</p>
                    <p className="text-base font-semibold text-white">142<span className="text-[9px] ml-1 text-gray-500">WPM</span></p>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: "65%" }}
                            transition={{ duration: 1.5, delay: 1.2 }}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-wider text-gray-500">Fillers</p>
                    <p className="text-base font-semibold text-orange-400">2</p>
                    <div className="flex gap-1 mt-1">
                        <div className="w-2 h-1 rounded-full bg-orange-500/50" />
                        <div className="w-2 h-1 rounded-full bg-orange-500/50" />
                        <div className="w-2 h-1 rounded-full bg-white/5" />
                        <div className="w-2 h-1 rounded-full bg-white/5" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MockupInterview;
