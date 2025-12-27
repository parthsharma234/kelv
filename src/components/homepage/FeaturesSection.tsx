import React from 'react';
import { motion } from 'framer-motion';
import DeviceMockup from './DeviceMockup';
import MockupResults from './MockupResults';
import { Mic, Sparkles, Target } from 'lucide-react';

/**
 * Features section with alternating left-right layouts (Stripe-style)
 */
const FeaturesSection: React.FC = () => {
    const features = [
        {
            id: 'voice',
            icon: Mic,
            title: 'Voice Intelligence',
            subtitle: 'Your voice tells the story before your words do',
            description: 'Kelv tracks confidence dips, filler word spikes, and pace changes in real-time. After your interview, you see exactly when the energy dropped and why.',
            proofs: ['Filler word tracking', 'Pace analysis', 'Confidence scoring'],
            mockup: 'waveform',
            gradient: 'from-orange-500/20 via-transparent to-transparent',
        },
        {
            id: 'story',
            icon: Sparkles,
            title: 'Story Coach',
            subtitle: 'Turn rambling answers into receipts',
            description: 'Kelv scores your STAR structure, flags when examples drift, and shows you how to land the metrics that hiring managers remember.',
            proofs: ['STAR framework scoring', 'Example analysis', 'Metric extraction'],
            mockup: 'results',
            gradient: 'from-purple-500/20 via-transparent to-transparent',
        },
        {
            id: 'targeted',
            icon: Target,
            title: 'Targeted Drills',
            subtitle: 'Practice the exact skill that cost you the offer',
            description: 'Based on your performance, Kelv queues focused drills—interrupt handling, technical pressure, or weak closing—until the gap is closed.',
            proofs: ['Personalized drill queue', 'Weakness detection', 'Progress tracking'],
            mockup: 'drills',
            gradient: 'from-blue-500/20 via-transparent to-transparent',
        },
    ];

    return (
        <section id="features" className="py-32 bg-[#030305] relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 grid-pattern opacity-20" />

            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    viewport={{ once: true }}
                    className="text-center mb-24"
                >
                    <span className="inline-block text-xs uppercase tracking-[0.3em] text-orange-400 mb-4">
                        Why Kelv works
                    </span>
                    <h2 className="text-4xl lg:text-5xl font-semibold text-white">
                        More than practice.{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                            Proof.
                        </span>
                    </h2>
                </motion.div>

                {/* Feature blocks */}
                <div className="space-y-32">
                    {features.map((feature, index) => {
                        const isReversed = index % 2 === 1;
                        const Icon = feature.icon;

                        return (
                            <motion.div
                                key={feature.id}
                                initial={{ opacity: 0, y: 60 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                viewport={{ once: true, margin: "-100px" }}
                                className={`grid lg:grid-cols-2 gap-16 items-center ${isReversed ? '' : ''}`}
                            >
                                {/* Content */}
                                <div className={`space-y-6 ${isReversed ? 'lg:order-2' : ''}`}>
                                    {/* Icon */}
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10">
                                        <Icon className="w-6 h-6 text-orange-400" />
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500 mb-2">{feature.subtitle}</p>
                                        <h3 className="text-3xl font-semibold text-white">{feature.title}</h3>
                                    </div>

                                    <p className="text-lg text-gray-400 leading-relaxed">
                                        {feature.description}
                                    </p>

                                    {/* Proof points */}
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {feature.proofs.map((proof) => (
                                            <span
                                                key={proof}
                                                className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400"
                                            >
                                                {proof}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Visual */}
                                <div className={`relative ${isReversed ? 'lg:order-1' : ''}`}>
                                    {/* Gradient glow */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} blur-3xl scale-110 opacity-50`} />

                                    <DeviceMockup variant="window" showChrome animate>
                                        {feature.mockup === 'results' ? (
                                            <MockupResults />
                                        ) : feature.mockup === 'waveform' ? (
                                            <WaveformMockup />
                                        ) : (
                                            <DrillsMockup />
                                        )}
                                    </DeviceMockup>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

/**
 * Waveform visualization mockup for voice analysis feature
 */
const WaveformMockup: React.FC = () => {
    return (
        <div className="bg-[#030305] p-6 min-h-[300px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Voice Analysis</p>
                    <h3 className="text-sm font-semibold text-white mt-1">Question 3: Leadership Story</h3>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold text-orange-400">78%</p>
                    <p className="text-[9px] text-gray-500">confidence</p>
                </div>
            </div>

            {/* Waveform visualization */}
            <div className="relative h-24 mb-6 flex items-center gap-0.5">
                {Array.from({ length: 60 }).map((_, i) => {
                    const height = Math.random() * 60 + 20;
                    const isHighlighted = i > 35 && i < 45;
                    return (
                        <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: i * 0.02, duration: 0.3 }}
                            className={`flex-1 rounded-full ${isHighlighted ? 'bg-orange-500/80' : 'bg-white/20'
                                }`}
                        />
                    );
                })}
                {/* Highlighted section marker */}
                <div className="absolute top-0 left-[58%] transform -translate-x-1/2 bg-orange-500/20 border border-orange-500/30 rounded px-2 py-0.5 text-[8px] text-orange-400">
                    Confidence dip
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: 'Pace', value: '142 WPM', status: 'good' },
                    { label: 'Fillers', value: '3', status: 'warning' },
                    { label: 'Pauses', value: '2.1s avg', status: 'good' },
                    { label: 'Energy', value: 'Steady', status: 'good' },
                ].map((metric) => (
                    <div key={metric.label} className="bg-[#0a0a0f] rounded-lg p-3 border border-white/5">
                        <p className="text-[9px] uppercase tracking-wider text-gray-500">{metric.label}</p>
                        <p className={`text-sm font-medium mt-1 ${metric.status === 'warning' ? 'text-orange-400' : 'text-white'
                            }`}>
                            {metric.value}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * Drills mockup for targeted practice feature
 */
const DrillsMockup: React.FC = () => {
    const drills = [
        { name: 'Interrupt Recovery', duration: '3 min', priority: 'high', progress: 0 },
        { name: 'Technical Deep-Dive', duration: '7 min', priority: 'medium', progress: 60 },
        { name: 'Closing Statement', duration: '2 min', priority: 'low', progress: 100 },
    ];

    return (
        <div className="bg-[#030305] p-6 min-h-[300px]">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Your Drill Queue</p>
                    <h3 className="text-sm font-semibold text-white mt-1">Based on last 3 sessions</h3>
                </div>
            </div>

            <div className="space-y-3">
                {drills.map((drill, i) => (
                    <motion.div
                        key={drill.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-4 rounded-xl border ${drill.priority === 'high'
                                ? 'bg-orange-500/5 border-orange-500/20'
                                : 'bg-white/5 border-white/5'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium ${drill.priority === 'high' ? 'text-orange-400' : 'text-white'
                                    }`}>
                                    {drill.name}
                                </span>
                                {drill.priority === 'high' && (
                                    <span className="text-[8px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded uppercase">
                                        Priority
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] text-gray-500">{drill.duration}</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${drill.progress}%` }}
                                transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                                className={`h-full rounded-full ${drill.progress === 100 ? 'bg-green-500' : 'bg-orange-500'
                                    }`}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default FeaturesSection;
