import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Video, Brain, Zap, Activity, AlertTriangle, CheckCircle, Mic, User, MessageSquare, List, Loader2, Lightbulb } from 'lucide-react';
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
import PerQuestionBreakdown from './PerQuestionBreakdown';
import { PerQuestionAnalytics } from '../../utils/perQuestionAnalytics';
import EnhancedCharts, { PostureAnalysisDisplay } from './EnhancedCharts';
import { generateInterviewFeedback, InterviewFeedback } from '../../utils/openAIFeedback';

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
        humeData?: any[];
        postureData?: {
            shoulderAlignment: number;
            headPosition: 'centered' | 'forward' | 'tilted';
            overallScore: number;
            timeInGoodPosture: number;
        };
        jobContext?: {
            role?: string;
            industry?: string;
            experienceLevel?: string;
        };
    };
    onBack: () => void;
}

const InterviewResults: React.FC<InterviewResultsProps> = ({ sessionData, onBack }) => {
    const { metrics, transcript, humeData, postureData, jobContext } = sessionData || {};

    const [activeTab, setActiveTab] = useState<'content' | 'voice' | 'presence' | 'perQuestion'>('perQuestion');
    const [aiFeedback, setAiFeedback] = useState<InterviewFeedback | null>(null);
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
    const [feedbackError, setFeedbackError] = useState<string | null>(null);

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

    // Process per-question analysis
    const perQuestionAnalysis = useMemo(() => {
        if (!humeData || !transcript || transcript.length === 0) {
            return null;
        }
        return PerQuestionAnalytics.process(humeData, transcript);
    }, [humeData, transcript]);

    // Generate AI feedback when content tab is active
    useEffect(() => {
        const generateFeedback = async () => {
            if (activeTab !== 'content' || aiFeedback || isLoadingFeedback) return;
            if (!transcript || transcript.length === 0) return;

            // Extract Q&A pairs from transcript
            const pairs: { question: string; answer: string; questionNumber: number }[] = [];
            let questionNum = 0;

            for (let i = 0; i < transcript.length; i++) {
                if (transcript[i].role === 'assistant' && transcript[i + 1]?.role === 'user') {
                    questionNum++;
                    pairs.push({
                        question: transcript[i].content,
                        answer: transcript[i + 1].content,
                        questionNumber: questionNum
                    });
                }
            }

            if (pairs.length === 0) return;

            setIsLoadingFeedback(true);
            setFeedbackError(null);

            try {
                const feedback = await generateInterviewFeedback(pairs, jobContext);
                setAiFeedback(feedback);
            } catch (error) {
                console.error('Failed to generate AI feedback:', error);
                setFeedbackError('Could not generate AI feedback. Please try again.');
            } finally {
                setIsLoadingFeedback(false);
            }
        };

        generateFeedback();
    }, [activeTab, transcript, jobContext, aiFeedback, isLoadingFeedback]);

    // Chart data generators
    const getTimelineChart = (label: string, dataKey: 'voiceConfidence' | 'faceConfidence', color: string) => ({
        labels: metrics.timeline.map(t => t.timestamp),
        datasets: [{
            label,
            data: metrics.timeline.map(t => t[dataKey] * 100),
            borderColor: color,
            backgroundColor: color + '1A',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2
        }]
    });

    const commonChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#6b7280', font: { size: 10 } } },
            x: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 } }
        }
    };

    // Grade helper
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
            {/* Header */}
            <header className="bg-[#030305]/80 backdrop-blur-xl border-b border-white/5 h-16 flex items-center justify-between px-8 flex-shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-sm font-bold uppercase tracking-wider text-white">Interview Analysis</h1>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${grade.color}`}>Grade {grade.letter} ({metrics.overallScore})</span>
                            <span className="text-[10px] text-gray-500">{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="flex items-center justify-center border-b border-white/5 bg-[#050508] py-2">
                <TabButton id="perQuestion" label="Per-Question" icon={List} active={activeTab} onClick={setActiveTab} />
                <TabButton id="content" label="Answer Quality" icon={MessageSquare} active={activeTab} onClick={setActiveTab} />
                <TabButton id="voice" label="Voice & Delivery" icon={Mic} active={activeTab} onClick={setActiveTab} />
                <TabButton id="presence" label="Posture & Face" icon={User} active={activeTab} onClick={setActiveTab} />
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6 relative">
                <AnimatePresence mode='wait'>
                    {activeTab === 'perQuestion' && (
                        <motion.div key="perQuestion" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-5xl mx-auto">
                            {perQuestionAnalysis ? (
                                <PerQuestionBreakdown analysis={perQuestionAnalysis} />
                            ) : (
                                <div className="bg-[#0f0f12] border border-white/5 rounded-2xl p-8 text-center">
                                    <p className="text-gray-400">Per-question analysis not available for this interview</p>
                                    <p className="text-sm text-gray-500 mt-2">This feature requires detailed interview data</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'content' && (
                        <motion.div key="content" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-5xl mx-auto space-y-6">
                            {/* Score Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <ScoreCard title="Content Score" score={metrics.contentScore} color="text-purple-400" />
                                <StatCard label="Response Depth" value={transcript.filter(t => t.role === 'user').length > 0 ? 'Analyzed' : 'N/A'} subtext={`${transcript.filter(t => t.role === 'user').length} responses`} icon={Brain} color="text-purple-400" />
                                <StatCard label="Questions Answered" value={transcript.filter(t => t.role === 'user').length.toString()} subtext="Total responses" icon={Activity} color="text-blue-400" />
                            </div>

                            {/* AI Feedback Section */}
                            <div className="bg-[#0f0f12] border border-white/5 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-orange-500/10 rounded-lg">
                                        <Lightbulb className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">AI-Powered Feedback</h3>
                                        <p className="text-xs text-gray-500">Context-aware analysis of your interview answers</p>
                                    </div>
                                </div>

                                {isLoadingFeedback && (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 text-orange-400 animate-spin mr-3" />
                                        <span className="text-gray-400">Analyzing your responses...</span>
                                    </div>
                                )}

                                {feedbackError && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                        {feedbackError}
                                    </div>
                                )}

                                {aiFeedback && (
                                    <div className="space-y-6">
                                        {/* Overall Summary */}
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <p className="text-sm text-gray-300 leading-relaxed">{aiFeedback.overallSummary}</p>
                                        </div>

                                        {/* Strengths & Improvements */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top Strengths</h4>
                                                {aiFeedback.topStrengths.map((strength, i) => (
                                                    <div key={i} className="flex gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                                                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                                        <p className="text-sm text-gray-300">{strength}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Areas to Improve</h4>
                                                {aiFeedback.criticalImprovements.map((improvement, i) => (
                                                    <div key={i} className="flex gap-3 p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                                                        <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                                                        <p className="text-sm text-gray-300">{improvement}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Per-Question AI Feedback */}
                                        {aiFeedback.questionFeedback.length > 0 && (
                                            <div className="space-y-4">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Question-by-Question Analysis</h4>
                                                {aiFeedback.questionFeedback.map((qf, i) => (
                                                    <QuestionFeedbackCard key={i} feedback={qf} />
                                                ))}
                                            </div>
                                        )}

                                        {/* Next Steps */}
                                        {aiFeedback.nextSteps.length > 0 && (
                                            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                                                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">Next Steps</h4>
                                                <ul className="space-y-2">
                                                    {aiFeedback.nextSteps.map((step, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                                            <span className="text-blue-400 font-bold">{i + 1}.</span>
                                                            {step}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!isLoadingFeedback && !aiFeedback && !feedbackError && transcript.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>No transcript data available for AI analysis</p>
                                    </div>
                                )}
                            </div>

                            {/* Transcript Snippets */}
                            {transcript.filter(t => t.role === 'user').length > 0 && (
                                <div className="bg-[#0f0f12] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Your Responses</h3>
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {transcript.filter(t => t.role === 'user').map((t, i) => (
                                            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
                                                <p className="text-sm text-gray-300">"{t.content}"</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'voice' && (
                        <motion.div key="voice" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-5xl mx-auto space-y-6">
                            {/* Score Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                <ScoreCard title="Delivery Score" score={metrics.deliveryScore} color="text-orange-400" />
                                <StatCard label="Pace (WPM)" value={Math.round(metrics.wpm).toString()} subtext="Target: 130-150" icon={Zap} color="text-yellow-400" />
                                <StatCard label="Filler Words" value={metrics.fillerWordCount.toString()} subtext={metrics.fillerWordCount > 5 ? "High" : "Good"} icon={AlertTriangle} color={metrics.fillerWordCount > 5 ? "text-red-400" : "text-green-400"} />
                                <StatCard label="Tonal Variety" value={`${metrics.tonalVariety}/100`} subtext={metrics.tonalVariety > 70 ? "Dynamic" : "Monotone"} icon={Activity} color={metrics.tonalVariety > 70 ? "text-green-400" : "text-orange-400"} />
                            </div>

                            {/* Enhanced Voice Charts */}
                            <EnhancedCharts metrics={metrics} />
                        </motion.div>
                    )}

                    {activeTab === 'presence' && (
                        <motion.div key="presence" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-5xl mx-auto space-y-6">
                            {/* Score Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <ScoreCard title="Presence Score" score={metrics.presenceScore} color="text-green-400" />
                                <StatCard label="Eye Contact" value={`${metrics.eyeContactEstimate}%`} subtext="Estimated via Face" icon={Video} color="text-blue-400" />
                                <StatCard label="Anxiety Level" value={metrics.anxietyLevel > 30 ? "High" : "Low"} subtext="Facial Tension" icon={Activity} color={metrics.anxietyLevel > 30 ? "text-red-400" : "text-green-400"} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Face Confidence Chart */}
                                <div className="lg:col-span-2 bg-[#0f0f12] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Facial Confidence Over Time</h3>
                                    <div className="h-[280px] w-full">
                                        <Line options={commonChartOptions} data={getTimelineChart('Face Confidence', 'faceConfidence', '#10b981')} />
                                    </div>
                                </div>

                                {/* Posture Analysis */}
                                <div className="bg-[#0f0f12] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Posture Analysis</h3>
                                    <div className="h-[280px]">
                                        <PostureAnalysisDisplay postureData={postureData} />
                                    </div>
                                </div>
                            </div>

                            {/* Expressions Chart */}
                            <div className="bg-[#0f0f12] border border-white/5 rounded-2xl p-6">
                                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Dominant Expressions</h3>
                                <div className="h-[250px] w-full flex items-center justify-center">
                                    <Bar options={{
                                        indexAxis: 'y' as const,
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            x: { display: true, max: 100, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#6b7280', callback: (v: any) => v + '%' } },
                                            y: { ticks: { color: '#9ca3af', font: { size: 11 } }, grid: { display: false } }
                                        }
                                    }} data={{
                                        labels: Object.keys(metrics.expressionBreakdown).slice(0, 6),
                                        datasets: [{
                                            data: Object.values(metrics.expressionBreakdown).slice(0, 6),
                                            backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'],
                                            borderRadius: 4
                                        }]
                                    }} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

// Subcomponents

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

const QuestionFeedbackCard = ({ feedback }: { feedback: any }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-500">Q{feedback.questionNumber}</span>
                    <span className="text-sm text-gray-300">{feedback.overallAssessment}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${feedback.contentAnalysis.score >= 70 ? 'text-green-400' : feedback.contentAnalysis.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {feedback.contentAnalysis.score}/100
                    </span>
                    <span className="text-gray-500 text-xs">{isExpanded ? 'Hide' : 'Details'}</span>
                </div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 space-y-4 border-t border-white/5">
                            {/* Delivery Notes */}
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Delivery</p>
                                <p className="text-sm text-gray-300">{feedback.deliveryNotes}</p>
                            </div>

                            {/* Suggested Answer */}
                            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                                <p className="text-xs text-blue-400 mb-1">Suggested Improvement</p>
                                <p className="text-sm text-gray-300">{feedback.suggestedAnswer}</p>
                            </div>

                            {/* Key Takeaway */}
                            <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                                <p className="text-xs text-orange-400 mb-1">Key Takeaway</p>
                                <p className="text-sm text-gray-300 font-medium">{feedback.keyTakeaway}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InterviewResults;
