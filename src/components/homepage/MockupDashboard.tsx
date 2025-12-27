import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mic, Brain, MessageSquare, Target, Sparkles } from 'lucide-react';

/**
 * Simplified dashboard mockup for homepage - shows Kelv's analytics dashboard
 * Based on PlatformDashboard.tsx but styled for marketing
 */
const MockupDashboard: React.FC = () => {
    const stats = [
        { label: 'Sessions', value: '12', trend: '+3 this week' },
        { label: 'Avg Score', value: '78', trend: '+8% improvement' },
        { label: 'Streak', value: '5 days', trend: 'Keep going!' },
    ];

    const recentSession = {
        type: 'Behavioral',
        score: 82,
        date: 'Today',
        strengths: ['Clear structure', 'Good examples'],
        improvements: ['Reduce filler words', 'Stronger closing'],
    };

    return (
        <div className="bg-[#030305] p-6 min-h-[420px] sm:min-h-[480px] lg:min-h-[520px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Kelv Control Room</p>
                    <h3 className="text-lg font-semibold text-white mt-1">Your Interview Dashboard</h3>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    className="px-4 py-2 bg-orange-500 text-white text-xs font-medium rounded-lg flex items-center gap-2"
                >
                    Start Interview <ArrowRight className="w-3 h-3" />
                </motion.button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-[#0a0a0f] border border-white/5 rounded-xl p-3"
                    >
                        <p className="text-[9px] uppercase tracking-wider text-gray-500">{stat.label}</p>
                        <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
                        <p className="text-[9px] text-orange-400 mt-1">{stat.trend}</p>
                    </motion.div>
                ))}
            </div>

            {/* Recent Session Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[#0a0a0f] border border-white/5 rounded-xl p-4"
            >
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-[9px] text-gray-500">{recentSession.date}</p>
                        <p className="text-sm font-medium text-white">{recentSession.type} Interview</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-orange-400">{recentSession.score}</p>
                        <p className="text-[9px] text-gray-500">score</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                        <p className="text-[8px] text-gray-500 uppercase mb-1">What landed</p>
                        <div className="flex flex-wrap gap-1">
                            {recentSession.strengths.map((s) => (
                                <span key={s} className="text-[9px] px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-[8px] text-gray-500 uppercase mb-1">Needs work</p>
                        <div className="flex flex-wrap gap-1">
                            {recentSession.improvements.map((s) => (
                                <span key={s} className="text-[9px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Focus Modes Preview */}
            <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                    { icon: Brain, label: 'Technical', color: 'orange' },
                    { icon: MessageSquare, label: 'Behavioral', color: 'purple' },
                    { icon: Target, label: 'Situational', color: 'blue' },
                ].map((mode, i) => (
                    <motion.div
                        key={mode.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className={`p-3 rounded-lg border border-white/5 bg-gradient-to-br from-${mode.color}-500/10 to-transparent cursor-pointer hover:border-${mode.color}-500/30 transition-colors`}
                    >
                        <mode.icon className={`w-4 h-4 text-${mode.color}-400 mb-1`} />
                        <p className="text-[10px] text-white font-medium">{mode.label}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default MockupDashboard;
