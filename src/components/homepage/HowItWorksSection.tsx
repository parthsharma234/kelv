import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Mic, BarChart3, Target } from 'lucide-react';

/**
 * How it works section - horizontal flow with mini mockups
 */
const HowItWorksSection: React.FC = () => {
    const steps = [
        {
            id: 1,
            icon: Settings,
            title: 'Set your target',
            description: 'Choose your role, industry, and experience level. Kelv tailors questions and rubrics to match.',
            mockupContent: <SetupMockup />,
        },
        {
            id: 2,
            icon: Mic,
            title: 'Run the interview',
            description: 'Kelv asks real questions and pushes with follow-ups. Your video, voice, and answers are analyzed live.',
            mockupContent: <InterviewMiniMockup />,
        },
        {
            id: 3,
            icon: BarChart3,
            title: 'Get your receipts',
            description: 'See exactly what landed, what drifted, and where your confidence dropped—with timestamps.',
            mockupContent: <ResultsMiniMockup />,
        },
        {
            id: 4,
            icon: Target,
            title: 'Run the drills',
            description: 'Kelv queues focused reps on your weak spots until the gap closes.',
            mockupContent: <DrillsMiniMockup />,
        },
    ];

    return (
        <section className="py-32 bg-gradient-to-b from-[#050508] to-[#030305] relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 dot-pattern opacity-20" />

            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <span className="inline-block text-xs uppercase tracking-[0.3em] text-orange-400 mb-4">
                        How it works
                    </span>
                    <h2 className="text-4xl lg:text-5xl font-semibold text-white">
                        From setup to receipts in{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                            15 minutes
                        </span>
                    </h2>
                </motion.div>

                {/* Steps grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {steps.map((step, index) => {
                        const Icon = step.icon;

                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="group"
                            >
                                {/* Card */}
                                <div className="relative h-full bg-[#0a0a0f] border border-white/5 rounded-2xl p-5 hover:border-orange-500/30 transition-colors">
                                    {/* Step number */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                            <Icon className="w-5 h-5 text-orange-400" />
                                        </div>
                                        <span className="text-5xl font-bold text-white/5 group-hover:text-orange-500/10 transition-colors">
                                            {step.id}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">{step.description}</p>

                                    {/* Mini mockup */}
                                    <div className="mt-4 rounded-xl overflow-hidden border border-white/5 bg-[#050508]">
                                        {step.mockupContent}
                                    </div>
                                </div>

                                {/* Connector (except last) */}
                                {index < steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-white/10" />
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

// Mini mockup components
const SetupMockup: React.FC = () => (
    <div className="p-3 space-y-2">
        {['Product Manager', 'Technology', 'Mid Level'].map((item, i) => (
            <div key={item} className={`text-[10px] py-1.5 px-3 rounded-lg ${i === 0 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-gray-500'
                }`}>
                {item}
            </div>
        ))}
    </div>
);

const InterviewMiniMockup: React.FC = () => (
    <div className="p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-[10px] font-bold text-white">
            K
        </div>
        <div className="flex-1 space-y-1">
            <div className="h-1.5 bg-white/10 rounded-full w-full" />
            <div className="h-1.5 bg-white/10 rounded-full w-2/3" />
        </div>
    </div>
);

const ResultsMiniMockup: React.FC = () => (
    <div className="p-3 grid grid-cols-3 gap-2">
        {[78, 85, 72].map((score, i) => (
            <div key={i} className="text-center">
                <p className="text-sm font-bold text-white">{score}</p>
                <p className="text-[8px] text-gray-500 uppercase">{['Content', 'Voice', 'Presence'][i]}</p>
            </div>
        ))}
    </div>
);

const DrillsMiniMockup: React.FC = () => (
    <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span className="text-[10px] text-orange-400">Interrupt Recovery</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-orange-500 rounded-full" />
        </div>
    </div>
);

export default HowItWorksSection;
