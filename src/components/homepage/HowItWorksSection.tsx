import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const HowItWorksSection: React.FC = () => {
    const steps = [
        {
            number: "01",
            title: "Choose your role & target",
            description: "Tell Kelv the title you’re practicing for and who’s interviewing you.",
            outcome: "We load the right rubrics, follow-ups, and question bank for that company.",
            statLabel: "Setup",
            statValue: "45s intake"
        },
        {
            number: "02",
            title: "Set the industry lens",
            description: "Pick the industry so prompts reference the problems and jargon you’ll actually get asked.",
            outcome: "Kelv mirrors the business priorities and follow-up digs that team really cares about.",
            statLabel: "Context",
            statValue: "Live"
        },
        {
            number: "03",
            title: "Dial in seniority",
            description: "Entry, mid, senior, or exec—Kelv adjusts depth, leadership digs, and pressure.",
            outcome: "You rehearse at the exact altitude you’ll be judged on in the real loop.",
            statLabel: "Tone",
            statValue: "Adaptive"
        },
        {
            number: "04",
            title: "Launch your format",
            description: "Voice reps for confidence/pacing, or text mode when you want a quiet sandbox.",
            outcome: "Every session logs receipts so mentors, recruiters, and future you can see the climb.",
            statLabel: "Evidence",
            statValue: "Session-by-session log"
        }
    ];

    const totalSteps = steps.length;
    const [activeStep, setActiveStep] = useState(0);
    const [stepPaused, setStepPaused] = useState(false);
    const stepProgress = totalSteps > 1 ? (activeStep / (totalSteps - 1)) * 100 : 0;

    useEffect(() => {
        if (stepPaused) {
            const resumeTimer = setTimeout(() => setStepPaused(false), 7000);
            return () => clearTimeout(resumeTimer);
        }
    }, [stepPaused]);

    useEffect(() => {
        if (stepPaused) return;
        const interval = setInterval(() => {
            setActiveStep(prev => (prev + 1) % totalSteps);
        }, 5000);
        return () => clearInterval(interval);
    }, [stepPaused, totalSteps]);

    return (
        <section id="how-it-works" className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-b from-dark-900 to-dark-800">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,120,60,0.12),transparent_60%)]" />
                <div className="absolute inset-x-0 top-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
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
                        The Kelv challenge flow
                    </h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                        From panic to proof in under 15 minutes. Practice real interviews, get objective feedback, build evidence-based confidence.
                    </p>
                </motion.div>

                <div className="relative max-w-5xl mx-auto">
                    <div className="hidden md:block absolute left-8 top-0 bottom-0 pointer-events-none">
                        <div className="w-px h-full bg-gradient-to-b from-orange-500/40 via-orange-500/5 to-transparent relative overflow-visible">
                            <motion.div
                                key={activeStep}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1, top: `${stepProgress}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                style={{ top: `${stepProgress}%` }}
                                className="absolute -left-[6px] w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]"
                            />
                        </div>
                    </div>
                    <div className="space-y-10">
                        {steps.map((step, index) => {
                            const isActive = activeStep === index;
                            return (
                                <motion.div
                                    key={step.number}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    viewport={{ once: true }}
                                    onMouseEnter={() => {
                                        setActiveStep(index);
                                        setStepPaused(true);
                                    }}
                                    className={`relative bg-dark-900/70 border rounded-3xl p-6 md:pl-20 shadow-[0_0_60px_rgba(0,0,0,0.35)] transition-all duration-300 ${isActive ? 'border-orange-500/60 bg-orange-500/5' : 'border-dark-700/60'
                                        }`}
                                >
                                    <motion.div
                                        layout
                                        className={`hidden md:flex absolute left-6 top-8 z-10 w-10 h-10 rounded-full border flex items-center justify-center text-sm font-semibold transition-colors ${isActive
                                                ? 'bg-orange-500 text-dark-900 border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.6)]'
                                                : 'bg-dark-800 text-orange-300 border-orange-500/40'
                                            }`}
                                    >
                                        {step.number}
                                    </motion.div>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: isActive ? '100%' : '0%' }}
                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-t-3xl"
                                    />
                                    <div className="flex flex-col gap-6 md:flex-row md:items-center">
                                        <div className="flex-1">
                                            <p className="text-xs uppercase tracking-[0.4em] text-orange-400">Step {step.number}</p>
                                            <h3 className="text-2xl font-semibold text-white mt-2">{step.title}</h3>
                                            <p className="text-lg text-gray-400 mt-2 leading-relaxed">{step.description}</p>
                                        </div>
                                        <div className="md:w-60">
                                            <div className={`bg-dark-800/80 border rounded-2xl p-4 transition-colors ${isActive ? 'border-orange-500/50' : 'border-dark-700'
                                                }`}>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">{step.statLabel}</p>
                                                <p className="text-white text-xl font-semibold">{step.statValue}</p>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide mt-4">Outcome</p>
                                                <p className="text-orange-400 text-sm mt-1 leading-relaxed">{step.outcome}</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    viewport={{ once: true }}
                    className="mt-16 text-center"
                >
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            const waitlist = document.getElementById('waitlist');
                            waitlist?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-12 py-4 rounded-full font-semibold shadow-lg shadow-orange-500/30"
                    >
                        Book a beta spot
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
