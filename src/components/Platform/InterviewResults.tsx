import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  ChevronDown,
  Info,
  LineChart,
  List,
  Loader2,
  MessageSquare,
  Mic,
  Target,
  User,
  Video
} from 'lucide-react';
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
import { Bar, Line } from 'react-chartjs-2';
import { AnalyticsEngine, InterviewMetrics } from '../../utils/analyticsEngine';
import { generateInterviewFeedback, InterviewFeedback } from '../../utils/openAIFeedback';
import { PerQuestionAnalysis } from '../../utils/perQuestionAnalytics';
import EnhancedCharts, { PostureAnalysisDisplay } from './EnhancedCharts';
import PerQuestionBreakdown from './PerQuestionBreakdown';

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
    transcript: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp: Date | string;
      isPartial?: boolean;
    }>;
    duration: number;
    perQuestionAnalysis?: PerQuestionAnalysis | null;
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
      jobDescription?: string;
    };
    processingSource?: string;
  };
  onBack: () => void;
}

const InterviewResults: React.FC<InterviewResultsProps> = ({ sessionData, onBack }) => {
  const metrics = sessionData?.metrics;
  const transcript = sessionData?.transcript || [];
  const postureData = sessionData?.postureData;
  const jobContext = sessionData?.jobContext;
  const perQuestionAnalysis = sessionData?.perQuestionAnalysis || null;

  const [activeTab, setActiveTab] = useState<'perQuestion' | 'content' | 'voice' | 'presence'>('perQuestion');
  const [aiFeedback, setAiFeedback] = useState<InterviewFeedback | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const benchmarks = useMemo(
    () => AnalyticsEngine.getBenchmarks(jobContext?.role),
    [jobContext?.role]
  );

  const qaPairs = useMemo(() => {
    const pairs: Array<{ question: string; answer: string; questionNumber: number }> = [];

    for (let index = 0; index < transcript.length - 1; index += 1) {
      const current = transcript[index];
      const next = transcript[index + 1];

      if (current.role === 'assistant' && next?.role === 'user') {
        pairs.push({
          question: current.content,
          answer: next.content,
          questionNumber: pairs.length + 1
        });
      }
    }

    return pairs;
  }, [transcript]);

  const strengths = metrics?.strengths || [];
  const weaknesses = metrics?.weaknesses || [];

  const strongestQuestion = perQuestionAnalysis?.strongestQuestion;
  const weakestQuestion = perQuestionAnalysis?.weakestQuestion;

  useEffect(() => {
    const run = async () => {
      if (activeTab !== 'content' || isLoadingFeedback || aiFeedback || qaPairs.length === 0) {
        return;
      }

      setIsLoadingFeedback(true);
      setFeedbackError(null);

      try {
        const feedback = await generateInterviewFeedback(qaPairs, jobContext);
        setAiFeedback(feedback);
      } catch (error) {
        console.error('Failed to generate AI feedback:', error);
        setFeedbackError('Could not generate AI coaching for this session.');
      } finally {
        setIsLoadingFeedback(false);
      }
    };

    run();
  }, [activeTab, aiFeedback, isLoadingFeedback, jobContext, qaPairs]);

  if (!metrics) {
    return (
      <div className="min-h-screen bg-[#050507] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-red-400 mb-3">Results unavailable</p>
          <p className="text-gray-400 mb-6">Kelv could not load the processed session data.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-sm bg-white/10 hover:bg-white/20 transition-colors"
          >
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }

  const grade = getGrade(metrics.overallScore);
  const scoreBreakdown = Object.entries(metrics.expressionBreakdown || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: '#6b7280', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280', font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }
      }
    }
  };

  const timelineChart = (label: string, key: 'voiceConfidence' | 'faceConfidence', color: string) => ({
    labels: metrics.timeline.map((point) => point.timestamp),
    datasets: [{
      label,
      data: metrics.timeline.map((point) => point[key] * 100),
      borderColor: color,
      backgroundColor: `${color}1A`,
      fill: true,
      tension: 0.35,
      pointRadius: 0,
      borderWidth: 2
    }]
  });

  return (
    <div className="min-h-screen bg-[#08080a] text-white font-sans flex flex-col relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-12%] left-[-8%] w-[42%] h-[42%] bg-orange-500/5 blur-[120px]" />
        <div className="absolute bottom-[-14%] right-[-8%] w-[40%] h-[40%] bg-sky-500/5 blur-[120px]" />
      </div>

      <header className="relative z-20 h-20 px-8 border-b border-white/[0.06] bg-[#08080a]/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="space-y-0.5">
            <h1 className="text-lg font-medium text-white/90">Interview Review</h1>
            <p className="text-xs text-gray-500">
              Transcript-led scoring with posture support where available.
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Overall Score</p>
            <div className="flex items-center gap-3">
              <span className={`text-xl font-medium ${grade.color}`}>{metrics.overallScore}%</span>
              <div className="h-4 w-px bg-white/10" />
              <span className="text-sm text-gray-400 italic font-serif">{grade.label}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <TabButton id="perQuestion" label="Storyline" icon={List} active={activeTab} onClick={setActiveTab} />
            <TabButton id="content" label="Content" icon={MessageSquare} active={activeTab} onClick={setActiveTab} />
            <TabButton id="voice" label="Delivery" icon={Mic} active={activeTab} onClick={setActiveTab} />
            <TabButton id="presence" label="Presence" icon={User} active={activeTab} onClick={setActiveTab} />
          </div>
          {benchmarks && (
            <div className="text-[11px] text-gray-500 italic">
              Benchmarks set for <span className="text-orange-300/60">{benchmarks.roleName}</span>
            </div>
          )}
        </div>
      </div>

      <main className="relative z-10 flex-1 overflow-y-auto px-6 py-10">
        <AnimatePresence mode="wait">
          {activeTab === 'perQuestion' && (
            <motion.div
              key="perQuestion"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-6xl mx-auto"
            >
              {perQuestionAnalysis && perQuestionAnalysis.questions.length > 0 ? (
                <PerQuestionBreakdown analysis={perQuestionAnalysis} />
              ) : (
                <EmptyPanel
                  title="Question-level breakdown unavailable"
                  description="Kelv needs a complete back-and-forth transcript to build question-by-question scoring."
                />
              )}
            </motion.div>
          )}

          {activeTab === 'content' && (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-6xl mx-auto space-y-10"
            >
              <SectionHeader
                eyebrow="Answer Quality"
                title="What your answers proved, and where they stayed thin"
                helper="Built from transcript structure, specificity, and pacing."
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ScoreCard
                  title="Content Score"
                  score={metrics.contentScore}
                  benchmark={benchmarks?.content}
                  tooltip="Measures answer depth, structure, and proof of impact."
                />
                <StatCard
                  label="Questions Answered"
                  value={qaPairs.length.toString()}
                  subtext={qaPairs.length > 0 ? 'Completed exchanges' : 'No transcript'}
                  icon={LineChart}
                  tooltip="Kelv only scores completed question-answer pairs."
                />
                <StatCard
                  label="Strongest Answer"
                  value={strongestQuestion ? `${strongestQuestion.overallScore}%` : '--'}
                  subtext={strongestQuestion ? `Q${strongestQuestion.questionNumber}` : 'Unavailable'}
                  icon={Target}
                  tooltip="Highest-scoring question based on content, delivery, and presence."
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SignalPanel
                  title="What Landed"
                  items={strengths.slice(0, 4).map((item) => ({ title: item.area, description: item.description }))}
                  emptyCopy="Kelv did not detect standout strengths in this run."
                  tone="positive"
                />
                <SignalPanel
                  title="What To Tighten"
                  items={weaknesses.slice(0, 4).map((item) => ({ title: item.area, description: item.description }))}
                  emptyCopy="No major issues were detected in the core scoring categories."
                  tone="warning"
                />
              </div>

              <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-8">
                <div className="flex items-center gap-3 mb-8">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Coach Synthesis</h3>
                  <div className="h-px flex-1 bg-white/[0.05]" />
                </div>

                {isLoadingFeedback && (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-5 h-5 text-gray-600 animate-spin mr-3" />
                    <span className="text-sm text-gray-500 font-light">Synthesizing coaching notes...</span>
                  </div>
                )}

                {feedbackError && (
                  <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-red-400/80 text-[13px] font-light">
                    {feedbackError}
                  </div>
                )}

                {aiFeedback && (
                  <div className="space-y-10">
                    <div className="max-w-4xl">
                      <p className="text-lg text-white/80 leading-relaxed font-light italic font-serif">
                        "{aiFeedback.overallSummary}"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <SimpleList
                        title="Top strengths"
                        items={aiFeedback.topStrengths}
                        accent="green"
                      />
                      <SimpleList
                        title="Critical improvements"
                        items={aiFeedback.criticalImprovements}
                        accent="orange"
                      />
                    </div>

                    {aiFeedback.questionFeedback.length > 0 && (
                      <div className="space-y-6 pt-10 border-t border-white/[0.04]">
                        <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Answer-by-answer coaching</h4>
                        <div className="grid grid-cols-1 gap-4">
                          {aiFeedback.questionFeedback.map((feedback, index) => (
                            <QuestionFeedbackCard key={`${feedback.questionNumber}-${index}`} feedback={feedback} />
                          ))}
                        </div>
                      </div>
                    )}

                    {aiFeedback.nextSteps.length > 0 && (
                      <div className="p-8 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Next practice moves</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {aiFeedback.nextSteps.map((step, index) => (
                            <div key={index} className="flex gap-4">
                              <span className="text-[10px] text-gray-700 font-bold mt-1">{index + 1}</span>
                              <p className="text-[13px] text-gray-400 font-light leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CalloutPanel
                  label="Bright spot"
                  title={strongestQuestion ? `Question ${strongestQuestion.questionNumber} was your cleanest answer.` : 'Kelv needs more transcript data.'}
                  body={strongestQuestion
                    ? strongestQuestion.questionText
                    : 'Run a fuller session to surface your best and weakest answers clearly.'}
                />
                <CalloutPanel
                  label="Practice target"
                  title={weakestQuestion ? `Question ${weakestQuestion.questionNumber} is the first rep to revisit.` : 'No weak-point target yet.'}
                  body={weakestQuestion
                    ? weakestQuestion.questionText
                    : 'Once a full exchange is captured, Kelv will identify the most valuable follow-up drill.'}
                />
              </div>

              {qaPairs.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Transcript excerpts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {qaPairs.slice(0, 4).map((pair) => (
                      <div key={pair.questionNumber} className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                        <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-3">Q{pair.questionNumber}</p>
                        <p className="text-sm text-gray-500 mb-3">{pair.question}</p>
                        <div className="text-sm text-gray-300 leading-relaxed">
                          <HighlightedText text={pair.answer} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'voice' && (
            <motion.div
              key="voice"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-6xl mx-auto space-y-10"
            >
              <SectionHeader
                eyebrow="Delivery"
                title="How steady, clear, and controlled the session felt"
                helper="These signals come from transcript timing, filler-word load, and cadence estimates."
              />

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <ScoreCard
                  title="Delivery Score"
                  score={metrics.deliveryScore}
                  benchmark={benchmarks?.delivery}
                  tooltip="Measures pace control, clarity, fillers, and cadence consistency."
                />
                <StatCard
                  label="Pace Estimate"
                  value={`${Math.round(metrics.wpm)} WPM`}
                  subtext="Target: 110-160"
                  icon={Mic}
                  tooltip="Estimated from transcript timing windows across completed answers."
                />
                <StatCard
                  label="Filler Words"
                  value={metrics.fillerWordCount.toString()}
                  subtext={metrics.fillerWordCount > 5 ? 'Needs cleanup' : 'Under control'}
                  icon={Activity}
                  tooltip="Counts repeated filler language such as 'um', 'uh', or 'like'."
                />
                <StatCard
                  label="Cadence Variety"
                  value={`${metrics.tonalVariety}/100`}
                  subtext={metrics.tonalVariety >= 70 ? 'Varied' : metrics.tonalVariety >= 50 ? 'Stable' : 'Flat'}
                  icon={LineChart}
                  tooltip="A cadence proxy based on transcript pacing and sentence variation."
                />
              </div>

              <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-8">
                <EnhancedCharts metrics={metrics} />
              </div>
            </motion.div>
          )}

          {activeTab === 'presence' && (
            <motion.div
              key="presence"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-6xl mx-auto space-y-10"
            >
              <SectionHeader
                eyebrow="Presence"
                title="How grounded and composed you looked on screen"
                helper={postureData
                  ? 'Presence score is supported by posture samples captured during the session.'
                  : 'No posture samples were captured, so presence leans on transcript timing and hesitation proxies.'}
              />

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <ScoreCard
                  title="Presence Score"
                  score={metrics.presenceScore}
                  benchmark={benchmarks?.presence}
                  tooltip="Combines posture steadiness with hesitation penalties during answers."
                />
                <StatCard
                  label="Visual Steadiness"
                  value={`${metrics.eyeContactEstimate}%`}
                  subtext={postureData ? 'Posture-backed' : 'Estimated'}
                  icon={Video}
                  tooltip="Derived from head position, posture consistency, and response steadiness."
                />
                <StatCard
                  label="Hesitation Level"
                  value={metrics.anxietyLevel > 40 ? 'High' : metrics.anxietyLevel > 20 ? 'Moderate' : 'Low'}
                  subtext={`${metrics.anxietyLevel}/100`}
                  icon={Activity}
                  tooltip="A hesitation proxy based on fillers, weak language, and long delays before answers."
                />
                <StatCard
                  label="Good Posture Time"
                  value={postureData ? `${postureData.timeInGoodPosture}%` : '--'}
                  subtext={postureData ? 'Tracked live' : 'Not captured'}
                  icon={User}
                  tooltip="Percentage of pose samples that met Kelv's good-posture threshold."
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#0b0b11] border border-white/10 rounded-lg p-8">
                  <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Presence Trend</h3>
                  <div className="h-[280px] w-full">
                    <Line
                      options={commonChartOptions}
                      data={timelineChart('Presence Trend', 'faceConfidence', '#10b981')}
                    />
                  </div>
                </div>

                <div className="bg-[#0b0b11] border border-white/10 rounded-lg p-8">
                  <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Posture Snapshot</h3>
                  <div className="h-[280px]">
                    <PostureAnalysisDisplay postureData={postureData} />
                  </div>
                </div>
              </div>

              <div className="bg-[#0b0b11] border border-white/10 rounded-lg p-8">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Signal Breakdown</h3>
                <div className="h-[260px]">
                  <Bar
                    options={{
                      indexAxis: 'y' as const,
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: {
                          display: true,
                          max: 100,
                          grid: { color: 'rgba(255,255,255,0.03)' },
                          ticks: { color: '#6b7280', callback: (value: any) => `${value}%` }
                        },
                        y: {
                          ticks: { color: '#9ca3af', font: { size: 11 } },
                          grid: { display: false }
                        }
                      }
                    }}
                    data={{
                      labels: scoreBreakdown.map(([label]) => label),
                      datasets: [{
                        data: scoreBreakdown.map(([, value]) => value),
                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#8b5cf6', '#ef4444'],
                        borderRadius: 4
                      }]
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const TabButton = ({ id, label, icon: Icon, active, onClick }: any) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm transition-all ${active === id
      ? 'bg-white/5 text-white ring-1 ring-white/10'
      : 'text-gray-500 hover:text-gray-300'
      }`}
  >
    <Icon className={`w-3.5 h-3.5 ${active === id ? 'text-orange-300/80' : 'text-gray-600'}`} />
    <span className={active === id ? 'font-medium' : ''}>{label}</span>
  </button>
);

const SectionHeader = ({ eyebrow, title, helper }: { eyebrow: string; title: string; helper: string }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="text-[11px] uppercase tracking-[0.35em] text-gray-500 mb-2">{eyebrow}</p>
      <h2 className="text-2xl font-semibold">{title}</h2>
    </div>
    <div className="text-xs text-gray-500 max-w-xs text-right">{helper}</div>
  </div>
);

const ScoreCard = ({ title, score, benchmark, tooltip }: any) => (
  <div className="group bg-white/[0.02] border border-white/[0.05] rounded-lg p-6 flex flex-col justify-between h-36 relative transition-all hover:bg-white/[0.04]">
    {tooltip && (
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-40 transition-opacity">
        <Info className="w-3.5 h-3.5 text-gray-500 cursor-help" />
      </div>
    )}
    <div>
      <h3 className="text-gray-500 text-[10px] font-medium uppercase tracking-widest mb-2">{title}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-light text-white/90 tracking-tight">{score}</span>
        {benchmark && (
          <span className="text-[10px] text-gray-600 font-serif italic">goal: {benchmark}</span>
        )}
      </div>
    </div>
    <div className="space-y-1">
      <div className="h-1 w-full bg-white/[0.03] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          className="h-full bg-white/20 rounded-full"
        />
      </div>
      <p className="text-[10px] text-gray-600">
        {benchmark ? (score >= benchmark ? 'Meeting target range' : 'Below target range') : 'Performance insight'}
      </p>
    </div>
  </div>
);

const StatCard = ({ label, value, subtext, icon: Icon, tooltip }: any) => (
  <div className="group bg-white/[0.01] border border-white/[0.04] rounded-lg p-6 flex flex-col justify-center h-32 relative transition-all hover:border-white/[0.08]">
    {tooltip && (
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-40 transition-opacity">
        <Info className="w-3 h-3 text-gray-500 cursor-help" />
      </div>
    )}
    <div className="absolute right-4 bottom-4 opacity-20">
      <Icon className="w-5 h-5 text-gray-500" />
    </div>
    <h3 className="text-gray-600 text-[10px] font-medium uppercase tracking-widest mb-1">{label}</h3>
    <p className="text-xl font-medium text-white/80 mb-0.5">{value}</p>
    <p className="text-[10px] text-gray-600 italic font-serif">{subtext}</p>
  </div>
);

const SignalPanel = ({
  title,
  items,
  emptyCopy,
  tone
}: {
  title: string;
  items: Array<{ title: string; description: string }>;
  emptyCopy: string;
  tone: 'positive' | 'warning';
}) => (
  <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-8">
    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">{title}</h3>
    <div className="space-y-4">
      {items.length === 0 && <p className="text-sm text-gray-500">{emptyCopy}</p>}
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className="flex gap-4">
          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${tone === 'positive' ? 'bg-green-500/30' : 'bg-orange-500/30'}`} />
          <div>
            <p className="text-sm text-white/80 font-medium mb-1">{item.title}</p>
            <p className="text-sm text-gray-500 leading-relaxed font-light">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SimpleList = ({ title, items, accent }: { title: string; items: string[]; accent: 'green' | 'orange' }) => (
  <div className="space-y-6">
    <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{title}</h4>
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="flex gap-4 group">
          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 transition-all group-hover:scale-150 ${accent === 'green' ? 'bg-green-500/20' : 'bg-orange-500/20'}`} />
          <p className="text-sm text-gray-400 font-light leading-relaxed">{item}</p>
        </div>
      ))}
    </div>
  </div>
);

const CalloutPanel = ({ label, title, body }: { label: string; title: string; body: string }) => (
  <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-8">
    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">{label}</p>
    <p className="text-xl text-white/90 leading-relaxed font-light mb-3">{title}</p>
    <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
  </div>
);

const EmptyPanel = ({ title, description }: { title: string; description: string }) => (
  <div className="bg-[#0b0b11] border border-white/10 rounded-lg p-10 text-center">
    <p className="text-gray-300 font-medium">{title}</p>
    <p className="text-sm text-gray-500 mt-2">{description}</p>
  </div>
);

const HighlightedText = ({ text }: { text: string }) => {
  const fillers = ['um', 'uh', 'like', 'actually', 'basically', 'really', 'just'];
  const weak = ['maybe', 'i think', 'sort of', 'kind of', 'might'];
  const words = text.split(/(\s+)/);

  return (
    <p className="leading-relaxed">
      {words.map((word, index) => {
        const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
        if (fillers.includes(cleanWord)) {
          return (
            <span key={index} className="text-white decoration-red-500/40 underline underline-offset-4 decoration-1 font-medium">
              {word}
            </span>
          );
        }
        if (weak.includes(cleanWord)) {
          return (
            <span key={index} className="text-white decoration-yellow-500/40 underline underline-offset-4 decoration-1 italic">
              {word}
            </span>
          );
        }
        return <span key={index} className="text-gray-300">{word}</span>;
      })}
    </p>
  );
};

const QuestionFeedbackCard = ({ feedback }: { feedback: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden transition-all hover:bg-white/[0.04]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-2 py-0.5 border border-white/5 rounded">
            Ref {feedback.questionNumber}
          </span>
          <span className="text-sm text-white/80 font-medium">{feedback.overallAssessment}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-lg font-light ${feedback.contentAnalysis.score >= 70 ? 'text-green-400' : feedback.contentAnalysis.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {feedback.contentAnalysis.score}%
          </span>
          <div className={`transition-all duration-300 ${isExpanded ? 'rotate-180 opacity-40' : 'opacity-20'}`}>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-8 border-t border-white/[0.04] pt-6">
              <div className="space-y-2">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-medium">Delivery Note</p>
                <p className="text-[13px] text-gray-400 font-light leading-relaxed italic">"{feedback.deliveryNotes}"</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-2">Coach Suggestion</p>
                  <p className="text-[13px] text-gray-300 font-light leading-relaxed">{feedback.suggestedAnswer}</p>
                </div>

                <div className="p-4 bg-orange-500/[0.02] border border-orange-500/10 rounded-xl">
                  <p className="text-[10px] text-orange-400/60 uppercase tracking-widest font-bold mb-1">Key Takeaway</p>
                  <p className="text-[13px] text-white/70 font-medium">{feedback.keyTakeaway}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function getGrade(score: number) {
  if (score >= 90) return { color: 'text-green-400', label: 'Offer-ready' };
  if (score >= 80) return { color: 'text-blue-400', label: 'Strong signal' };
  if (score >= 70) return { color: 'text-yellow-400', label: 'Getting there' };
  if (score >= 60) return { color: 'text-orange-400', label: 'Gap identified' };
  return { color: 'text-red-500', label: 'Not yet' };
}

export default InterviewResults;
