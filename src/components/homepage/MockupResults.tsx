import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

/**
 * Simplified results/analytics mockup for homepage
 * Shows interview feedback with charts and insights
 */
const MockupResults: React.FC = () => {
    const metrics = {
        overall: 82,
        content: 78,
        delivery: 85,
        presence: 80,
    };

    const strengths = [
        'Structured answers using STAR method',
        'Good eye contact throughout',
        'Specific metrics and examples',
    ];

    const improvements = [
        'Reduce "um" and "like" by 40%',
        'Slow down during technical explanations',
        'End answers with stronger conclusions',
    ];

    return (
        <div className="bg-[#030305] p-6 min-h-[400px]">
            {/* Header with Score */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Interview Analysis</p>
                    <h3 className="text-lg font-semibold text-white mt-1">Session Complete</h3>
                </div>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="relative"
                >
                    <div className="w-20 h-20 rounded-full border-4 border-orange-500/30 flex items-center justify-center">
                        <div className="text-center">
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-2xl font-bold text-orange-400"
                            >
                                {metrics.overall}
                            </motion.span>
                            <p className="text-[8px] text-gray-500 uppercase">Score</p>
                        </div>
                    </div>
                    {/* Grade badge */}
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        B
                    </div>
                </motion.div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                    { label: 'Content', score: metrics.content, color: 'purple' },
                    { label: 'Delivery', score: metrics.delivery, color: 'orange' },
                    { label: 'Presence', score: metrics.presence, color: 'green' },
                ].map((item, i) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="bg-[#0a0a0f] border border-white/5 rounded-xl p-3"
                    >
                        <p className="text-[9px] uppercase tracking-wider text-gray-500">{item.label}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xl font-bold text-${item.color}-400`}>{item.score}</span>
                            <TrendingUp className={`w-3 h-3 text-${item.color}-400`} />
                        </div>
                        {/* Mini progress bar */}
                        <div className="h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.score}%` }}
                                transition={{ delay: 0.6 + i * 0.1, duration: 0.8 }}
                                className={`h-full bg-${item.color}-500 rounded-full`}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <p className="text-[10px] uppercase tracking-wider text-gray-500">What Landed</p>
                    </div>
                    <div className="space-y-2">
                        {strengths.map((s, i) => (
                            <div key={i} className="text-[10px] text-gray-400 flex items-start gap-2">
                                <span className="text-green-400 mt-0.5">•</span>
                                {s}
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-3 h-3 text-orange-400" />
                        <p className="text-[10px] uppercase tracking-wider text-gray-500">Next Reps</p>
                    </div>
                    <div className="space-y-2">
                        {improvements.map((s, i) => (
                            <div key={i} className="text-[10px] text-gray-400 flex items-start gap-2">
                                <span className="text-orange-400 mt-0.5">•</span>
                                {s}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default MockupResults;
