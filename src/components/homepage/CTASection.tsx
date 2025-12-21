import React from 'react';
import { motion } from 'framer-motion';
import RedPandaLogo from '../RedPandaLogo';
import WaitlistForm from '../WaitlistForm';

const CTASection: React.FC = () => {
    return (
        <section id="waitlist" className="py-24 md:py-32 bg-dark-800 relative overflow-hidden">
            {/* Animated background particles */}
            <div className="absolute inset-0">
                {[...Array(40)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-orange-500/20 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -50, 0],
                            opacity: [0.1, 0.5, 0.1],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: 5 + Math.random() * 3,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>

            {/* Floating gradient orbs */}
            <motion.div
                className="absolute w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"
                style={{ top: '20%', left: '5%' }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1],
                }}
                transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
                className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
                style={{ bottom: '10%', right: '5%' }}
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.1, 0.2, 0.1],
                }}
                transition={{ duration: 10, repeat: Infinity }}
            />

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="mb-8"
                    >
                        <motion.div
                            animate={{
                                y: [0, -10, 0],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <RedPandaLogo size="lg" animate={true} className="mx-auto mb-6" />
                        </motion.div>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-semibold text-white mb-12"
                    >
                        See how you actually interview
                    </motion.h2>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        viewport={{ once: true }}
                    >
                        <WaitlistForm />
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default CTASection;
