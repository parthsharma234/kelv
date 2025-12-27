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
            }, 900);
        }, 4200);

        return () => clearInterval(interval);
    }, [transcript.length]);

    return (
        <div className="bg-[#030305] min-h-[440px] lg:min-h-[500px] flex flex-col overflow-hidden">
            {/* Top bar */}
            <div className="h-10 px-5 flex items-center justify-between border-b border-white/5 bg-[#0a0a0f]">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">Live Transcript</span>
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-[0.3em]">Mock Interview</div>
            </div>

            <div className="flex-1 grid grid-cols-[1.1fr_1.3fr_0.6fr]">
                {/* Left: Transcript */}
                <div className="border-r border-white/5 p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        <span className="text-[10px] uppercase tracking-wider text-gray-500">Live transcript</span>
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
                                    <span className={`text-[9px] font-bold uppercase mt-1 ${msg.role === 'ai' ? 'text-orange-400' : 'text-gray-500'}`}>
                                        {msg.role === 'ai' ? 'Kelv' : 'You'}
                                    </span>
                                    <p className="text-[12px] text-gray-300 leading-relaxed max-w-[92%] font-medium">
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
                <div className="flex flex-col items-center justify-center p-6 border-r border-white/5 relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.04),transparent_60%)]" />

                    <div className="flex-1 flex items-center justify-center relative">
                        <motion.div
                            className="absolute w-40 h-40 rounded-full border border-white/10"
                            animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.12, 0.25] }}
                            transition={{ duration: 4.6, repeat: Infinity }}
                        />
                        <motion.div
                            className="relative z-10"
                            animate={{ scale: isTyping ? [1, 1.05, 1] : 1 }}
                            transition={{ duration: 0.6, repeat: isTyping ? Infinity : 0 }}
                        >
                            <RedPandaLogo size="xl" animate={isTyping} />
                        </motion.div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-orange-400">Kelv</span>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500">AI interviewer</span>
                    </div>
                </div>

                {/* Right: Voice Analysis */}
                <div className="p-6 flex flex-col justify-center gap-8 bg-[#0a0a0f]">
                    <div className="space-y-2">
                        <p className="text-[9px] uppercase tracking-wider text-gray-500">Confidence</p>
                        <p className="text-lg font-semibold text-white">78%</p>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-green-500"
                                initial={{ width: 0 }}
                                animate={{ width: '78%' }}
                                transition={{ duration: 1.4, delay: 0.6 }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[9px] uppercase tracking-wider text-gray-500">Pace</p>
                        <p className="text-lg font-semibold text-white">
                            142<span className="text-[9px] ml-1 text-gray-500">WPM</span>
                        </p>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-blue-500"
                                initial={{ width: 0 }}
                                animate={{ width: '65%' }}
                                transition={{ duration: 1.4, delay: 0.8 }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[9px] uppercase tracking-wider text-gray-500">Fillers</p>
                        <p className="text-lg font-semibold text-orange-400">2</p>
                        <div className="flex gap-1 mt-1">
                            <div className="w-2 h-1 rounded-full bg-orange-500/50" />
                            <div className="w-2 h-1 rounded-full bg-orange-500/50" />
                            <div className="w-2 h-1 rounded-full bg-white/5" />
                            <div className="w-2 h-1 rounded-full bg-white/5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom controls */}
            <div className="h-16 px-6 border-t border-white/5 bg-[#0a0a0f] flex items-center justify-center gap-3">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <Mic className="w-4 h-4 text-white" />
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <Video className="w-4 h-4 text-white" />
                </div>
                <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-[0.3em] text-gray-400">
                    Live session
                </div>
            </div>
        </div>
    );
};

export default MockupInterview;
