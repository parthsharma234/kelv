import React from 'react';
import { motion } from 'framer-motion';
import RedPandaLogo from '../RedPandaLogo';

/**
 * Visual before/after transformation section
 * Shows the difference in interview performance
 */
const TransformationSection: React.FC = () => {

    const beforeAnswer = {
        text: "Um, yeah so I think... we basically had to, like, do this thing where we needed to improve the process? And I, um, worked with the team and we kind of figured out some stuff and it was like, pretty successful I guess?",
        issues: ['7 filler words', 'No metrics', 'Weak structure', 'Hedging language'],
    };

    const afterAnswer = {
        text: "I led a 4-person team to redesign our checkout flow. We identified a 23% cart abandonment rate, A/B tested 3 solutions, and shipped within 6 weeks—resulting in a $2.1M revenue increase.",
        strengths: ['Zero fillers', 'Clear metrics', 'STAR structure', 'Confident delivery'],
    };

    return (
        <section className="py-32 bg-[#030305] relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 lg:px-10">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-block text-xs uppercase tracking-[0.3em] text-orange-400 mb-4">
                        The transformation
                    </span>
                    <h2 className="text-4xl lg:text-5xl font-semibold text-white mb-6">
                        Same story.{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                            Different delivery.
                        </span>
                    </h2>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Kelv transforms rambling answers into structured receipts that hiring managers remember.
                    </p>
                </motion.div>

                {/* Before/After comparison */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Before */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="absolute -top-4 left-4 px-3 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full border border-red-500/30">
                            Before Kelv
                        </div>
                        <div className="bg-[#0a0a0f] border border-red-500/20 rounded-2xl p-6 h-full">
                            {/* Chat bubble */}
                            <div className="flex items-start gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                                    👤
                                </div>
                                <div className="flex-1 bg-red-500/5 border border-red-500/10 rounded-xl rounded-tl-none p-4">
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        "{beforeAnswer.text}"
                                    </p>
                                </div>
                            </div>

                            {/* Issues */}
                            <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">AI-detected issues</p>
                                <div className="flex flex-wrap gap-2">
                                    {beforeAnswer.issues.map((issue) => (
                                        <span
                                            key={issue}
                                            className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20"
                                        >
                                            {issue}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Score */}
                            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                                <span className="text-sm text-gray-500">Interview Score</span>
                                <span className="text-2xl font-bold text-red-400">47</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* After */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="absolute -top-4 left-4 px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                            After Kelv
                        </div>
                        <div className="bg-[#0a0a0f] border border-green-500/20 rounded-2xl p-6 h-full">
                            {/* Chat bubble */}
                            <div className="flex items-start gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-dark-800 border border-dark-700">
                                    <RedPandaLogo size="sm" animate={false} />
                                </div>
                                <div className="flex-1 bg-green-500/5 border border-green-500/10 rounded-xl rounded-tl-none p-4">
                                    <p className="text-sm text-gray-200 leading-relaxed">
                                        "{afterAnswer.text}"
                                    </p>
                                </div>
                            </div>

                            {/* Strengths */}
                            <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">What landed</p>
                                <div className="flex flex-wrap gap-2">
                                    {afterAnswer.strengths.map((strength) => (
                                        <span
                                            key={strength}
                                            className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20"
                                        >
                                            {strength}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Score */}
                            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                                <span className="text-sm text-gray-500">Interview Score</span>
                                <span className="text-2xl font-bold text-green-400">89</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Improvement arrow */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="flex justify-center mt-8"
                >
                    <div className="px-6 py-3 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-medium">
                        +42 point improvement after 3 sessions
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default TransformationSection;
