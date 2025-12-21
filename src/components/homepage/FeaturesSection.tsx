import React from 'react';
import { motion } from 'framer-motion';
import {
    MicrophoneIcon,
    SparklesIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

const FeaturesSection: React.FC = () => {
    const features = [
        {
            icon: MicrophoneIcon,
            title: "AI mock interviews",
            description: "Kelv listens like a hiring manager and tells you, word-for-word, what landed and what didn't.",
            pain: "You start strong, then ramble the second they interrupt or ask you to go deeper.",
            outcome: "Kelv calls out filler words, shaky tone, and missing receipts in real time so you reset before the next round.",
            proof: ["Live filler tracker", "Pace + clarity radar", "Follow-up prompts"],
            color: "orange"
        },
        {
            icon: SparklesIcon,
            title: "Confidence intelligence",
            description: "See the exact moment your voice drops, your eyes dart, or your story loses punch.",
            pain: "You can't tell if you sound confident or just hopeful.",
            outcome: "Energy, tone, and eye-contact insights show you what the recruiter actually hears.",
            proof: ["Tone timeline", "Energy scorecards", "Camera reminders"],
            color: "blue"
        },
        {
            icon: CheckCircleIcon,
            title: "Story coach",
            description: "Turn messy answers into tight, evidence-backed narratives.",
            pain: "Your stories wander, miss metrics, or never stick the landing.",
            outcome: "Kelv rebuilds your answer with STAR-style beats and receipts you can deliver on command.",
            proof: ["Auto STAR outline", "Impact prompts", "Next-question prep"],
            color: "orange"
        }
    ];

    return (
        <section id="features" className="py-24 md:py-32 bg-dark-900 relative overflow-hidden">
            {/* Floating interview-themed elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-4xl opacity-5"
                        style={{
                            left: `${10 + i * 12}%`,
                            top: `${20 + (i % 3) * 25}%`,
                        }}
                        animate={{
                            y: [0, -20, 0],
                            rotate: [0, 5, 0],
                            opacity: [0.05, 0.15, 0.05],
                        }}
                        transition={{
                            duration: 4 + i,
                            repeat: Infinity,
                            delay: i * 0.5,
                        }}
                    >
                        {['💼', '🎤', '💡', '⭐', '📊', '🎯', '💬', '🚀'][i]}
                    </motion.div>
                ))}
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
                        We fix the moments that cost you offers
                    </h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                        AI mock interviews that give you brutally honest feedback on what you're doing wrong and the proof when you finally nail it.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.15, duration: 0.6 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -5 }}
                                className="group relative bg-dark-800 rounded-xl p-8 border border-dark-700 hover:border-orange-500/50 transition-all duration-300"
                            >
                                {/* Subtle glow on hover */}
                                <div className={`absolute -inset-0.5 bg-${feature.color}-500/0 group-hover:bg-${feature.color}-500/10 rounded-xl blur transition-all duration-300`} />

                                <div className="relative">
                                    <motion.div
                                        className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-6"
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        <Icon className="w-6 h-6 text-orange-500" />
                                    </motion.div>
                                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                                    <p className="text-gray-400 mb-6 leading-relaxed">{feature.description}</p>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pain</p>
                                            <p className="text-white/90">{feature.pain}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Outcome</p>
                                            <p className="text-gray-300">{feature.outcome}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-6 mt-6 border-t border-dark-700/70">
                                        {feature.proof.map((item, i) => (
                                            <motion.span
                                                key={i}
                                                className="text-xs text-gray-400 bg-dark-700/60 px-3 py-1 rounded-full"
                                                initial={{ opacity: 0, y: 10 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.15 + i * 0.1 }}
                                                viewport={{ once: true }}
                                            >
                                                {item}
                                            </motion.span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
};

export default FeaturesSection;
