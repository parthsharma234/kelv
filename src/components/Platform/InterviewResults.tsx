import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Share2, Download, Video, Brain, Zap, Activity, AlertTriangle, CheckCircle, Mic, User, MessageSquare } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { InterviewMetrics } from '../../utils/analyticsEngine';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface InterviewResultsProps {
    sessionData: {
        metrics: InterviewMetrics;
        transcript: any[];
        duration: number;
    };
    onBack: () => void;
}

const InterviewResults: React.FC<InterviewResultsProps> = ({ sessionData, onBack }) => {
    const { metrics, transcript } = sessionData || {};

    if (!metrics) {
        return (
            <div className="min-h-screen bg-[#030305] text-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl font-bold mb-4 text-red-400">Analysis Data Missing</p>
                    <p className="text-gray-400 mb-6">Could not load interview results.</p>
                    <button onClick={onBack} className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const [activeTab, setActiveTab] = useState<'content' | 'voice' | 'presence'>('content');

    // --- CHART DATA GENERATORS ---
    const getTimelineChart = (label: string, dataKey: 'voiceConfidence' | 'faceConfidence', color: string) => ({
        labels: metrics.timeline.map(t => t.timestamp),
        datasets: [{
            label,
            data: metrics.timeline.map(t => t[dataKey] * 100),
            borderColor: color,
            backgroundColor: color + '1A', // 10% opacity hex approximation
            fill: true,
            tension: 0.4
        }]
    });

    const commonChartOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
            x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
        }
    };

    // --- GRADE HELPER ---
    const getGrade = (score: number) => {
        if (score >= 90) return { letter: 'A', color: 'text-green-400' };
        if (score >= 80) return { letter: 'B', color: 'text-blue-400' };
        if (score >= 70) return { letter: 'C', color: 'text-yellow-400' };
        if (score >= 60) return { letter: 'D', color: 'text-orange-400' };
        return { letter: 'F', color: 'text-red-500' };
    };
    const grade = getGrade(metrics.overallScore);

    return (
        <div className="min-h-screen bg-[#030305] text-white font-sans overflow-hidden flex flex-col">
            {/* --- HEADER --- */}
            <header className="bg-[#030305]/80 backdrop-blur-xl border-b border-white/5 h-16 flex items-center justify-between px-8 flex-shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-sm font-bold uppercase tracking-wider text-white">Interview Analysis</h1>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${grade.color}`}>Grade {grade.letter} ({metrics.overallScore})</span>
                            <span className="text-[10px] text-gray-500">• {new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium transition flex items-center gap-2">
                        <Share2 className="w-3 h-3" /> Share
                    </button>
                    <button className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 rounded-lg text-xs font-medium transition flex items-center gap-2 shadow-lg shadow-orange-500/20">
                        <Download className="w-3 h-3" /> PDF
                    </button>
                </div>
            </header>

            {/* --- TAB NAVIGATION --- */}
            <div className="flex items-center justify-center border-b border-white/5 bg-[#050508] py-2">
                <TabButton id="content" label="Answer Quality" icon={MessageSquare} active={activeTab} onClick={setActiveTab} />
                <TabButton id="voice" label="Voice & delivery" icon={Mic} active={activeTab} onClick={setActiveTab} />
                <TabButton id="presence" label="Posture & Face" icon={User} active={activeTab} onClick={setActiveTab} />
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="flex-1 overflow-y-auto p-6 relative">
                <AnimatePresence mode='wait'>
                    {activeTab === 'content' && (
                        <motion.div key="content" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-5xl mx-auto space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Score Card */}
                                <ScoreCard title="Content Score" score={metrics.contentScore} color="text-purple-400" />

                                {/* Key Stats */}
                                <StatCard label="Response Depth" value="High" subtext={`${transcript.length} turns`} icon={Brain} color="text-purple-400" />
                                <StatCard label="Topic Coverage" value="85%" subtext="Technical/Behavioral" icon={Activity} color="text-blue-400" />
                            </div>

                            {/* Feedback List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FeedbackSection title="What you did well" type="strength" items={metrics.strengths} />
                                <FeedbackSection title="Areas for Improvement" type="weakness" items={metrics.weaknesses} />
                            </div>

                            {/* Transcript Snippets (Real Data) */}
                            <div className="bg-[#0f0f12] border border-white/5 rounded-2xl p-6">
                                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Transcript Highlights</h3>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {transcript.filter(t => t.role === 'user').map((t, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <p className="text-sm text-gray-300">"{t.content}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'voice' && (
                        <motion.div key="voice" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-5xl mx-auto space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                <ScoreCard title="Delivery Score" score={metrics.deliveryScore} color="text-orange-400" />
                                <StatCard label="Pace (WPM)" value={Math.round(metrics.wpm).toString()} subtext="Target: 130-150" icon={Zap} color="text-yellow-400" />
                                <StatCard label="Filler Words" value={metrics.fillerWordCount.toString()} subtext={metrics.fillerWordCount > 5 ? "Too High" : "Good"} icon={AlertTriangle} color={metrics.fillerWordCount > 5 ? "text-red-400" : "text-green-400"} />
                                <StatCard label="Tonal Variety" value={`${metrics.tonalVariety}/100`} subtext={metrics.tonalVariety > 70 ? "Dynamic" : "Monotone"} icon={Activity} color={metrics.tonalVariety > 70 ? "text-green-400" : "text-orange-400"} />
                            </div>

                            {/* Main Voice Chart */}
                            <div className="bg-[#0f0f12] border border-white/5 rounded-2xl p-6 h-[400px]">
                                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Vocal Confidence Timeline (5s intervals)</h3>
                                <div className="h-[300px] w-full">
                                    <Line options={commonChartOptions} data={getTimelineChart('Vocal Confidence', 'voiceConfidence', '#f97316')} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'presence' && (
                        <motion.div key="presence" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-5xl mx-auto space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <ScoreCard title="Presence Score" score={metrics.presenceScore} color="text-green-400" />
                                <StatCard label="Eye Contact" value={`${metrics.eyeContactEstimate}%`} subtext="Estimated via Face" icon={Video} color="text-blue-400" />
                                <StatCard label="Anxiety Level" value={metrics.anxietyLevel > 30 ? "High" : "Low"} subtext="Facial Tension" icon={Activity} color={metrics.anxietyLevel > 30 ? "text-red-400" : "text-green-400"} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
                                {/* Face Confidence Chart */}
                                <div className="bg-[#0f0f12] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Facial Confidence & Calmness</h3>
                                    <div className="h-[300px] w-full">
                                        <Line options={commonChartOptions} data={getTimelineChart('Face Confidence', 'faceConfidence', '#10b981')} />
                                    </div>
                                </div>

                                {/* Emotions Chart */}
                                <div className="bg-[#0f0f12] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Dominant Micro-Expressions</h3>
                                    <div className="h-[300px] w-full flex items-center justify-center">
                                        <Bar options={{
                                            indexAxis: 'y' as const,
                                            responsive: true,
                                            plugins: { legend: { display: false } },
                                            scales: { x: { display: false }, y: { ticks: { color: '#9ca3af' }, grid: { display: false } } }
                                        }} data={{
                                            labels: Object.keys(metrics.expressionBreakdown).slice(0, 5),
                                            datasets: [{
                                                data: Object.values(metrics.expressionBreakdown).slice(0, 5),
                                                backgroundColor: ['#f97316', '#10b981', '#3b82f6', '#ef4444', '#a855f7'],
                                                borderRadius: 4
                                            }]
                                        }} />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-center text-sm font-medium">
                                Posture Analysis is currently in Beta. Coming soon.
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

// --- SUBCOMPONENTS ---

const TabButton = ({ id, label, icon: Icon, active, onClick }: any) => (
    <button
        onClick={() => onClick(id)}
        className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${active === id
            ? 'bg-white/10 text-white shadow-lg shadow-white/5'
            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
    >
        <Icon className={`w-4 h-4 ${active === id ? 'text-orange-400' : 'text-gray-500'}`} />
        {label}
    </button>
);

const ScoreCard = ({ title, score, color }: any) => (
    <div className="bg-[#0f0f12] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden h-32">
        <div className={`absolute top-0 right-0 p-16 ${color.replace('text-', 'bg-')}/5 rounded-full blur-xl`} />
        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
        <span className={`text-4xl font-black ${color}`}>{score}/100</span>
    </div>
);

const StatCard = ({ label, value, subtext, icon: Icon, color }: any) => (
    <div className="bg-[#0f0f12] border border-white/5 rounded-2xl p-6 flex items-center justify-between h-32">
        <div>
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</h3>
            <p className="text-2xl font-bold text-white mb-1">{value}</p>
            <p className="text-xs text-gray-400">{subtext}</p>
        </div>
        <div className={`p-3 rounded-xl bg-white/5 ${color.split(' ')[0]}`}>
            <Icon className={`w-5 h-5 ${color}`} />
        </div>
    </div>
);

const FeedbackSection = ({ title, type, items }: any) => (
    <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{title}</h3>
        {items.length > 0 ? items.map((item: any, i: number) => (
            <div key={i} className={`p-4 rounded-xl border flex gap-3 ${type === 'weakness'
                ? item.severity === 'critical' ? 'border-red-500/30 bg-red-500/5' : 'border-yellow-500/30 bg-yellow-500/5'
                : 'border-green-500/30 bg-green-500/5'
                }`}>
                {type === 'weakness' ? <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" /> : <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />}
                <div>
                    <h4 className={`text-sm font-bold mb-1 ${type === 'weakness' ? 'text-red-400' : 'text-green-400'
                        }`}>{item.area}</h4>
                    <p className="text-sm text-gray-300">{item.description}</p>
                </div>
            </div>
        )) : (
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-gray-500 text-sm italic">None detected.</div>
        )}
    </div>
);

export default InterviewResults;
