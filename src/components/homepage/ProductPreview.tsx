import React from 'react';
import { motion } from 'framer-motion';
import DeviceMockup from './DeviceMockup';
import MockupInterview from './MockupInterview';

/**
 * Product preview section - shows Kelv in action with the interview mockup
 */
const ProductPreview: React.FC = () => {
    return (
        <section className="py-32 bg-gradient-to-b from-[#030305] to-[#050508] relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 dot-pattern opacity-30" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />

            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-block text-xs uppercase tracking-[0.3em] text-orange-400 mb-4">
                        Live in action
                    </span>
                    <h2 className="text-4xl lg:text-5xl font-semibold text-white mb-6">
                        Real-time feedback that matters
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Kelv listens like a hiring manager and shows you exactly what they hear—
                        confidence dips, filler spikes, story structure—all while you're still talking.
                    </p>
                </motion.div>

                {/* Product mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="relative max-w-5xl mx-auto"
                >
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-blue-500/10 blur-3xl scale-110" />

                    <DeviceMockup variant="laptop" showChrome>
                        <MockupInterview />
                    </DeviceMockup>

                    {/* Floating feature callouts */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        viewport={{ once: true }}
                        className="absolute -left-4 lg:-left-12 top-[60%] bg-[#0a0a0f]/90 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl max-w-[180px] z-10"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <p className="text-[10px] uppercase tracking-wider text-gray-500">Live Transcript</p>
                        </div>
                        <p className="text-sm text-white font-medium">See exactly what you said and how you said it</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7, duration: 0.6 }}
                        viewport={{ once: true }}
                        className="absolute -right-4 lg:-right-12 top-[10%] bg-[#0a0a0f]/90 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl max-w-[180px] z-10"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <p className="text-[10px] uppercase tracking-wider text-gray-500">Voice Analysis</p>
                        </div>
                        <p className="text-sm text-white font-medium">Tracks filler words, pace, and energy in real-time</p>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default ProductPreview;
