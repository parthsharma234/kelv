import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';

const AnimatedCounter: React.FC<{ value: number; suffix?: string; duration?: number }> = ({
    value,
    suffix = '',
    duration = 2
}) => {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const counterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!counterRef.current || hasAnimated) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setHasAnimated(true);
                    const steps = 60;
                    const increment = value / steps;
                    const stepDuration = (duration * 1000) / steps;

                    let currentStep = 0;
                    const timer = setInterval(() => {
                        currentStep++;
                        if (currentStep <= steps) {
                            setCount(Math.min(Math.round(increment * currentStep), value));
                        } else {
                            clearInterval(timer);
                        }
                    }, stepDuration);

                    return () => clearInterval(timer);
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(counterRef.current);
        return () => observer.disconnect();
    }, [value, duration, hasAnimated]);

    return <div ref={counterRef}>{count}{suffix}</div>;
};

const TransformationSection: React.FC = () => {
    return (
        <section className="py-24 md:py-32 bg-dark-900">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-6xl font-semibold text-white mb-6">
                        From shaky answers to receipts
                    </h2>
                    <p className="text-xl text-gray-400 font-light max-w-3xl mx-auto">
                        Give us 4 weeks and we cut the filler words, double your confidence, and help you walk into interviews with proof.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    {/* BEFORE */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="bg-dark-800 rounded-2xl p-8 border border-red-500/20"
                    >
                        <div className="text-center mb-6">
                            <span className="text-red-400 text-2xl font-semibold">BEFORE</span>
                        </div>
                        <div className="space-y-6">
                            <p className="text-gray-400 text-lg font-light">"Um... so... I think... like..."</p>

                            <div className="space-y-4">
                                {/* Confidence */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 font-light">Confidence</span>
                                        <span className="text-red-400 font-semibold text-2xl">
                                            <AnimatedCounter value={45} suffix="%" />
                                        </span>
                                    </div>
                                    <div className="w-full bg-dark-700 rounded-full h-2">
                                        <motion.div
                                            className="bg-red-500 h-2 rounded-full"
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '45%' }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            viewport={{ once: true }}
                                        />
                                    </div>
                                </div>

                                {/* Filler Words */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 font-light">Filler Words</span>
                                        <span className="text-red-400 font-semibold text-2xl">
                                            <AnimatedCounter value={23} suffix="/min" duration={1.5} />
                                        </span>
                                    </div>
                                </div>

                                {/* Speech Rate */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 font-light">Speech Rate</span>
                                        <span className="text-red-400 font-semibold text-2xl">
                                            <AnimatedCounter value={95} suffix=" WPM" duration={1.5} />
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">Too slow - sounds unsure</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* AFTER */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        viewport={{ once: true }}
                        className="bg-dark-800 rounded-2xl p-8 border border-orange-500/30 relative"
                    >
                        <div className="absolute top-6 right-6">
                            <SparklesIcon className="w-6 h-6 text-orange-400" />
                        </div>

                        <div className="text-center mb-6">
                            <span className="text-orange-400 text-2xl font-semibold">AFTER</span>
                        </div>
                        <div className="space-y-6">
                            <p className="text-gray-200 font-medium text-lg">"I led a team of 8 engineers..."</p>

                            <div className="space-y-4">
                                {/* Confidence */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 font-light">Confidence</span>
                                        <span className="text-orange-400 font-semibold text-2xl">
                                            <AnimatedCounter value={92} suffix="%" />
                                        </span>
                                    </div>
                                    <div className="w-full bg-dark-700 rounded-full h-2">
                                        <motion.div
                                            className="bg-orange-500 h-2 rounded-full"
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '92%' }}
                                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                            viewport={{ once: true }}
                                        />
                                    </div>
                                </div>

                                {/* Filler Words */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 font-light">Filler Words</span>
                                        <span className="text-orange-400 font-semibold text-2xl">
                                            <AnimatedCounter value={2} suffix="/min" duration={1.5} />
                                        </span>
                                    </div>
                                </div>

                                {/* Speech Rate */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 font-light">Speech Rate</span>
                                        <span className="text-orange-400 font-semibold text-2xl">
                                            <AnimatedCounter value={145} suffix=" WPM" duration={1.5} />
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">Perfect - sounds confident</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default TransformationSection;
