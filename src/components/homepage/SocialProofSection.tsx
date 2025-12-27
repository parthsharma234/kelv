import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, Clock } from 'lucide-react';

/**
 * Social proof section - credibility signals without specific waitlist numbers
 */
const SocialProofSection: React.FC = () => {
    const proofPoints = [
        {
            icon: Zap,
            title: 'Real interview practice',
            description: 'Every question and rubric is built from patterns that actually appear in tech interviews—not generic prep materials.',
        },
        {
            icon: Shield,
            title: 'Privacy-first',
            description: 'Your recordings stay yours. We process locally where possible and never sell your data.',
        },
        {
            icon: Clock,
            title: 'Launching soon',
            description: 'We\'re putting the finishing touches on Kelv. Join the waitlist to be first in line when we go live.',
        },
    ];

    return (
        <section className="py-24 bg-gradient-to-b from-[#030305] to-[#050508] relative">
            <div className="max-w-5xl mx-auto px-6 lg:px-10">
                <div className="grid md:grid-cols-3 gap-8">
                    {proofPoints.map((point, index) => {
                        const Icon = point.icon;
                        return (
                            <motion.div
                                key={point.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="text-center"
                            >
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 mb-4">
                                    <Icon className="w-5 h-5 text-orange-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">{point.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{point.description}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default SocialProofSection;
