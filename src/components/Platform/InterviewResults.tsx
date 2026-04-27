import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  ChevronDown,
  LineChart,
  List,
  Loader2,
  MessageSquare,
  Mic,
  Target,
  User,
  Video,
  Zap,
  CheckCircle,
  AlertTriangle
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
    practicePlan?: any[];
    signalFusion?: any;
    signalReliability?: any;
    sessionResultV2?: any;
    processingSource?: string;
  };
  onBack: () => void;
}

type TabId = 'perQuestion' | 'content' | 'voice' | 'presence' | 'lens';

const InterviewResults: React.FC<InterviewResultsProps> = ({ sessionData, onBack }) => {
  const metrics = sessionData?.metrics;
  const transcript = sessionData?.transcript || [];
  const postureData = sessionData?.postureData;
  const jobContext = sessionData?.jobContext;
  const perQuestionAnalysis = sessionData?.perQuestionAnalysis || null;

  const practicePlan = useMemo(
    () => sessionData?.practicePlan || sessionData?.sessionResultV2?.recommended_drills || [],
    [sessionData?.practicePlan, sessionData?.sessionResultV2]
  );

  const signalFusion = useMemo(
    () => sessionData?.signalFusion || sessionData?.sessionResultV2?.signal_fusion || null,
    [sessionData?.signalFusion, sessionData?.sessionResultV2]
  );

  const signalReliability = useMemo(
    () => sessionData?.signalReliability || sessionData?.sessionResultV2?.signal_reliability || null,
    [sessionData?.signalReliability, sessionData?.sessionResultV2]
  );

  // Prefer V2 overall score; fall back to legacy
  const overallScore = useMemo(
    () => sessionData?.sessionResultV2?.overall_scores?.overall ?? metrics?.overallScore ?? 0,
    [sessionData?.sessionResultV2, metrics]
  );

  const v2Scores = sessionData?.sessionResultV2?.overall_scores ?? null;
  const readinessSignal: 'strong' | 'developing' | 'limited' | null =
    signalFusion?.fused?.interview_readiness_signal ?? null;

  const [activeTab, setActiveTab] = useState<TabId>('perQuestion');
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
        pairs.push({ question: current.content, answer: next.content, questionNumber: pairs.length + 1 });
      }
    }
    return pairs;
  }, [transcript]);

  const strengths = metrics?.strengths || [];
  const weaknesses = metrics?.weaknesses || [];
  const strongestQuestion = perQuestionAnalysis?.strongestQuestion;
  const weakestQuestion = perQuestionAnalysis?.weakestQuestion;

  const coachSignalContext = useMemo(() => ({
    metrics,
    perQuestionAnalysis,
    practicePlan,
    signalFusion
  }), [metrics, perQuestionAnalysis, practicePlan, signalFusion]);

  useEffect(() => {
    const run = async () => {
      if (activeTab !== 'content' || isLoadingFeedback || aiFeedback || qaPairs.length === 0) return;
      setIsLoadingFeedback(true);
      setFeedbackError(null);
      try {
        const feedback = await generateInterviewFeedback(qaPairs, jobContext, coachSignalContext);
        setAiFeedback(feedback);
      } catch (error) {
        console.error('Failed to generate AI feedback:', error);
        setFeedbackError('Coaching synthesis unavailable. Showing local analysis below.');
      } finally {
        setIsLoadingFeedback(false);
      }
    };
    run();
  }, [activeTab, aiFeedback, isLoadingFeedback, jobContext, qaPairs, coachSignalContext]);

  if (!metrics) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: 500, color: '#f87171', marginBottom: '8px' }}>Results unavailable</p>
          <p style={{ fontSize: '14px', color: 'var(--text-4)', marginBottom: '24px' }}>Kelv could not load the processed session data.</p>
          <button
            onClick={onBack}
            style={{ padding: '10px 20px', borderRadius: '6px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'pointer', fontSize: '14px' }}
          >
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }

  const grade = getGrade(overallScore);
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
        ticks: { color: '#62666d', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#62666d', font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }
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

  const tabs: Array<{ id: TabId; label: string; icon: any }> = [
    { id: 'perQuestion', label: 'Storyline', icon: List },
    { id: 'content', label: 'Content', icon: MessageSquare },
    { id: 'voice', label: 'Delivery', icon: Mic },
    { id: 'presence', label: 'Presence', icon: User },
    { id: 'lens', label: 'Kelv LENS', icon: Zap },
  ];

  const topDrill = practicePlan?.[0] ?? null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBack}
            style={{ padding: '6px', marginLeft: '-6px', borderRadius: '6px', color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-4)')}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
          </button>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>Interview Review</p>
            <p style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>
              {jobContext?.role || 'Session'} {jobContext?.experienceLevel ? `· ${jobContext.experienceLevel}` : ''}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {readinessSignal && (
            <ReadinessTag signal={readinessSignal} />
          )}
          {signalReliability?.overall_confidence != null && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Confidence</p>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', fontFamily: 'IBM Plex Mono, monospace' }}>
                {Math.round(signalReliability.overall_confidence * 100)}%
              </p>
            </div>
          )}
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Score</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px', fontWeight: 500, color: grade.color, fontFamily: 'IBM Plex Mono, monospace' }}>{overallScore}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>{grade.label}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0 32px', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          {tabs.map((tab) => (
            <FlatTabButton
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              active={activeTab}
              onClick={setActiveTab}
            />
          ))}
          {benchmarks && (
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>
              benchmarks · <span style={{ color: 'var(--orange)' }}>{benchmarks.roleName}</span>
            </span>
          )}
        </div>
      </div>

      {/* Score summary bar */}
      {(v2Scores || metrics) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}>
          {[
            { label: 'Overall', score: v2Scores?.overall ?? overallScore },
            { label: 'Content', score: v2Scores?.content ?? metrics.contentScore },
            { label: 'Delivery', score: v2Scores?.delivery ?? metrics.deliveryScore },
            { label: 'Presence', score: v2Scores?.presence ?? metrics.presenceScore },
          ].map((item, i) => (
            <div
              key={item.label}
              style={{
                padding: '14px 24px',
                borderRight: i < 3 ? '1px solid var(--border)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {item.label}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '48px', height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.score}%`, background: getScoreColor(item.score), borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace' }}>
                  {item.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <AnimatePresence mode="wait">

          {/* Storyline tab */}
          {activeTab === 'perQuestion' && (
            <motion.div
              key="perQuestion"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ maxWidth: '1120px', margin: '0 auto' }}
            >
              {perQuestionAnalysis && perQuestionAnalysis.questions.length > 0 ? (
                <PerQuestionBreakdown analysis={perQuestionAnalysis} />
              ) : (
                <FlatEmptyPanel
                  title="Question-level breakdown unavailable"
                  description="Kelv needs a complete back-and-forth transcript to build question-by-question scoring."
                />
              )}
            </motion.div>
          )}

          {/* Content tab */}
          {activeTab === 'content' && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}
            >

              {/* Next Practice — surface practicePlan[0] prominently */}
              {topDrill && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--orange)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                        Next practice
                      </p>
                      <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>{topDrill.drillType?.replace(/-/g, ' ') || 'Focused drill'}</p>
                      {topDrill.weakPoint && (
                        <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>Focus: {topDrill.weakPoint}</p>
                      )}
                    </div>
                    {topDrill.repetitionTarget && (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '24px', fontWeight: 500, color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>{topDrill.repetitionTarget}</p>
                        <p style={{ fontSize: '10px', color: 'var(--text-4)', marginTop: '2px' }}>reps target</p>
                      </div>
                    )}
                  </div>
                  {topDrill.completionCriteria && (
                    <div style={{ padding: '12px 16px', background: 'var(--surface-2)', borderRadius: '4px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle style={{ width: '13px', height: '13px', color: 'var(--orange)', marginTop: '1px', flexShrink: 0 }} />
                      <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                        <span style={{ color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pass: </span>
                        {topDrill.completionCriteria}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Score row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <FlatScoreCard
                  title="Content Score"
                  score={v2Scores?.content ?? metrics.contentScore}
                  benchmark={benchmarks?.content}
                  tooltip="Measures answer depth, structure, and proof of impact."
                />
                <FlatStatCard
                  label="Questions Answered"
                  value={qaPairs.length.toString()}
                  subtext={qaPairs.length > 0 ? 'Completed exchanges' : 'No transcript'}
                  icon={LineChart}
                />
                <FlatStatCard
                  label="Strongest Answer"
                  value={strongestQuestion ? `${strongestQuestion.overallScore}%` : '--'}
                  subtext={strongestQuestion ? `Q${strongestQuestion.questionNumber}` : 'Unavailable'}
                  icon={Target}
                />
              </div>

              {/* Strengths / weaknesses */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FlatSignalPanel
                  title="What landed"
                  items={strengths.slice(0, 4).map((item) => ({ title: item.area, description: item.description }))}
                  emptyCopy="Kelv did not detect standout strengths in this run."
                  tone="positive"
                />
                <FlatSignalPanel
                  title="What to tighten"
                  items={weaknesses.slice(0, 4).map((item) => ({ title: item.area, description: item.description }))}
                  emptyCopy="No major issues were detected in the core scoring categories."
                  tone="warning"
                />
              </div>

              {/* Coach Synthesis */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Coach synthesis
                  </p>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                </div>

                {isLoadingFeedback && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
                    <Loader2 style={{ width: '16px', height: '16px', color: 'var(--text-4)', marginRight: '10px' }} className="animate-spin" />
                    <span style={{ fontSize: '13px', color: 'var(--text-4)' }}>Synthesizing coaching notes…</span>
                  </div>
                )}

                {feedbackError && (
                  <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)', borderRadius: '6px', fontSize: '13px', color: 'rgba(253,224,71,0.8)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle style={{ width: '13px', height: '13px', flexShrink: 0 }} />
                    {feedbackError}
                  </div>
                )}

                {aiFeedback && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    <p style={{ fontSize: '16px', color: 'var(--text-2)', lineHeight: '1.65', maxWidth: '680px' }}>
                      "{aiFeedback.overallSummary}"
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                      <FlatSimpleList title="Top strengths" items={aiFeedback.topStrengths} accent="green" />
                      <FlatSimpleList title="Critical improvements" items={aiFeedback.criticalImprovements} accent="orange" />
                    </div>

                    {aiFeedback.questionFeedback.length > 0 && (
                      <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
                          Answer-by-answer coaching
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {aiFeedback.questionFeedback.map((feedback, index) => (
                            <QuestionFeedbackCard key={`${feedback.questionNumber}-${index}`} feedback={feedback} />
                          ))}
                        </div>
                      </div>
                    )}

                    {aiFeedback.nextSteps.length > 0 && (
                      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '20px 24px' }}>
                        <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
                          Next practice moves
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                          {aiFeedback.nextSteps.map((step, index) => (
                            <div key={index} style={{ display: 'flex', gap: '16px', padding: '12px 16px', background: 'var(--surface)' }}>
                              <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', paddingTop: '2px', flexShrink: 0 }}>
                                {String(index + 1).padStart(2, '0')}
                              </span>
                              <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.55' }}>{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Fallback when no feedback and not loading */}
                {!isLoadingFeedback && !aiFeedback && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {signalFusion?.fused?.coaching_focus && (
                      <div style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: '6px', borderLeft: '2px solid var(--orange)' }}>
                        <p style={{ fontSize: '10px', color: 'var(--orange)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                          Coaching focus
                        </p>
                        <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.55' }}>{signalFusion.fused.coaching_focus}</p>
                      </div>
                    )}
                    {qaPairs.length === 0 && (
                      <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>
                        Complete a full session to unlock coaching synthesis.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Callout panels */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FlatCalloutPanel
                  label="Bright spot"
                  title={strongestQuestion ? `Q${strongestQuestion.questionNumber} was your cleanest answer.` : 'Kelv needs more transcript data.'}
                  body={strongestQuestion ? strongestQuestion.questionText : 'Run a fuller session to surface your best and weakest answers clearly.'}
                />
                <FlatCalloutPanel
                  label="Practice target"
                  title={weakestQuestion ? `Q${weakestQuestion.questionNumber} is the first rep to revisit.` : 'No weak-point target yet.'}
                  body={weakestQuestion ? weakestQuestion.questionText : 'Once a full exchange is captured, Kelv will identify the most valuable follow-up drill.'}
                />
              </div>

              {/* Transcript excerpts */}
              {qaPairs.length > 0 && (
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                    Transcript excerpts
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {qaPairs.slice(0, 4).map((pair) => (
                      <div key={pair.questionNumber} style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                        <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', marginBottom: '10px' }}>Q{pair.questionNumber}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-4)', marginBottom: '10px' }}>{pair.question}</p>
                        <HighlightedText text={pair.answer} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Delivery tab */}
          {activeTab === 'voice' && (
            <motion.div
              key="voice"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <div>
                <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                  Delivery
                </p>
                <h2 style={{ fontSize: '22px', fontWeight: 510, letterSpacing: '-0.015em', color: 'var(--text)', marginBottom: '4px' }}>
                  How steady, clear, and controlled the session felt
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>
                  These signals come from transcript timing, filler-word load, and cadence estimates.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <FlatScoreCard
                  title="Delivery Score"
                  score={v2Scores?.delivery ?? metrics.deliveryScore}
                  benchmark={benchmarks?.delivery}
                  tooltip="Measures pace control, clarity, fillers, and cadence consistency."
                />
                <FlatStatCard
                  label="Pace Estimate"
                  value={`${Math.round(metrics.wpm)} WPM`}
                  subtext="Target: 110–160"
                  icon={Mic}
                />
                <FlatStatCard
                  label="Filler Words"
                  value={metrics.fillerWordCount.toString()}
                  subtext={metrics.fillerWordCount > 5 ? 'Needs cleanup' : 'Under control'}
                  icon={Activity}
                />
                <FlatStatCard
                  label="Cadence Variety"
                  value={`${metrics.tonalVariety}/100`}
                  subtext={metrics.tonalVariety >= 70 ? 'Varied' : metrics.tonalVariety >= 50 ? 'Stable' : 'Flat'}
                  icon={LineChart}
                />
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '24px' }}>
                <EnhancedCharts metrics={metrics} />
              </div>
            </motion.div>
          )}

          {/* Presence tab */}
          {activeTab === 'presence' && (
            <motion.div
              key="presence"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <div>
                <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                  Presence
                </p>
                <h2 style={{ fontSize: '22px', fontWeight: 510, letterSpacing: '-0.015em', color: 'var(--text)', marginBottom: '4px' }}>
                  How grounded and composed you looked on screen
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>
                  {postureData
                    ? 'Presence score is supported by posture samples captured during the session.'
                    : 'No posture samples were captured — presence leans on transcript timing and hesitation proxies.'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <FlatScoreCard
                  title="Presence Score"
                  score={v2Scores?.presence ?? metrics.presenceScore}
                  benchmark={benchmarks?.presence}
                  tooltip="Combines posture steadiness with hesitation penalties during answers."
                />
                <FlatStatCard
                  label="Visual Steadiness"
                  value={`${metrics.eyeContactEstimate}%`}
                  subtext={postureData ? 'Posture-backed' : 'Estimated'}
                  icon={Video}
                />
                <FlatStatCard
                  label="Hesitation Level"
                  value={metrics.anxietyLevel > 40 ? 'High' : metrics.anxietyLevel > 20 ? 'Moderate' : 'Low'}
                  subtext={`${metrics.anxietyLevel}/100`}
                  icon={Activity}
                />
                <FlatStatCard
                  label="Good Posture Time"
                  value={postureData ? `${postureData.timeInGoodPosture}%` : '--'}
                  subtext={postureData ? 'Tracked live' : 'Not captured'}
                  icon={User}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '24px' }}>
                  <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                    Presence trend
                  </p>
                  <div style={{ height: '240px' }}>
                    <Line options={commonChartOptions} data={timelineChart('Presence Trend', 'faceConfidence', '#10b981')} />
                  </div>
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '24px' }}>
                  <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                    Posture snapshot
                  </p>
                  <div style={{ height: '240px' }}>
                    <PostureAnalysisDisplay postureData={postureData} />
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '24px' }}>
                <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                  Signal breakdown
                </p>
                <div style={{ height: '220px' }}>
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
                          ticks: { color: '#62666d', callback: (value: any) => `${value}%` }
                        },
                        y: {
                          ticks: { color: '#8a8f98', font: { size: 11 } },
                          grid: { display: false }
                        }
                      }
                    }}
                    data={{
                      labels: scoreBreakdown.map(([label]) => label),
                      datasets: [{
                        data: scoreBreakdown.map(([, value]) => value),
                        backgroundColor: ['rgba(16,185,129,0.5)', 'rgba(59,130,246,0.5)', 'rgba(245,158,11,0.5)', 'rgba(232,101,26,0.5)', 'rgba(139,92,246,0.5)', 'rgba(239,68,68,0.5)'],
                        borderRadius: 3
                      }]
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Kelv LENS tab */}
          {activeTab === 'lens' && (
            <motion.div
              key="lens"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <div>
                <p style={{ fontSize: '10px', color: 'var(--orange)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                  Kelv LENS · Local Evidence-Normalized Signals
                </p>
                <h2 style={{ fontSize: '22px', fontWeight: 510, letterSpacing: '-0.015em', color: 'var(--text)', marginBottom: '4px' }}>
                  Voice and camera signal fusion
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>
                  No external AI APIs. All signal is derived locally from your audio and camera feed.
                </p>
              </div>

              {!signalFusion ? (
                <FlatEmptyPanel
                  title="LENS data unavailable"
                  description="Signal fusion was not computed for this session. This typically means the session ended before enough samples were collected."
                />
              ) : (
                <>
                  {/* Readiness + Coaching focus */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                        Readiness signal
                      </p>
                      {readinessSignal && <ReadinessTag signal={readinessSignal} large />}
                      {signalFusion.fused?.delivery_presence_score != null && (
                        <div style={{ marginTop: '16px' }}>
                          <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                            Delivery + presence
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ flex: 1, height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${signalFusion.fused.delivery_presence_score}%`, background: 'var(--orange)', borderRadius: '2px' }} />
                            </div>
                            <span style={{ fontSize: '13px', color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace' }}>
                              {signalFusion.fused.delivery_presence_score}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {signalFusion.fused?.coaching_focus && (
                      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '24px' }}>
                        <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                          Coaching focus
                        </p>
                        <p style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: '1.6' }}>
                          {signalFusion.fused.coaching_focus}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Voice signals */}
                  {signalFusion.voice && (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <Mic style={{ width: '13px', height: '13px', color: 'var(--orange)' }} />
                        <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Voice analysis
                        </p>
                        {signalFusion.voice.audio_source && (
                          <span style={{ marginLeft: 'auto', fontSize: '10px', color: signalFusion.voice.audio_source === 'recording_blob' ? 'rgba(34,197,94,0.8)' : 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', padding: '2px 8px', background: signalFusion.voice.audio_source === 'recording_blob' ? 'rgba(34,197,94,0.08)' : 'var(--surface-2)', border: `1px solid ${signalFusion.voice.audio_source === 'recording_blob' ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`, borderRadius: '3px' }}>
                            {signalFusion.voice.audio_source === 'recording_blob' ? 'recording-backed' : 'transcript proxy'}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                        {[
                          { label: 'Pace score', value: signalFusion.voice.pace_score, fmt: (v: number) => `${v}/100` },
                          { label: 'Filler control', value: signalFusion.voice.filler_control, fmt: (v: number) => `${v}/100` },
                          { label: 'Pause control', value: signalFusion.voice.pause_control, fmt: (v: number) => `${v}/100` },
                          { label: 'Articulation', value: signalFusion.voice.articulation_proxy, fmt: (v: number) => `${v}/100` },
                          { label: 'Clarity', value: signalFusion.voice.clarity_score, fmt: (v: number) => `${v}/100` },
                          { label: 'Fluency', value: signalFusion.voice.fluency_score, fmt: (v: number) => `${v}/100` },
                        ].filter(m => m.value != null).map((m) => (
                          <div key={m.label} style={{ background: 'var(--surface)', padding: '16px 20px' }}>
                            <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{m.label}</p>
                            <p style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace', marginBottom: '6px' }}>{m.fmt(m.value)}</p>
                            <div style={{ height: '2px', background: 'var(--border)', borderRadius: '1px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${m.value}%`, background: m.value >= 70 ? 'rgba(34,197,94,0.7)' : m.value >= 50 ? 'var(--orange)' : '#ef4444', borderRadius: '1px' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vision signals */}
                  {signalFusion.vision && (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <Video style={{ width: '13px', height: '13px', color: 'var(--orange)' }} />
                        <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Camera analysis
                        </p>
                        {signalFusion.vision.sample_count != null && (
                          <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>
                            {signalFusion.vision.sample_count} samples
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                        {[
                          { label: 'Posture score', value: signalFusion.vision.posture_score, fmt: (v: number) => `${v}/100` },
                          { label: 'Head centering', value: signalFusion.vision.head_centering, fmt: (v: number) => `${v}/100` },
                          { label: 'Visual stability', value: signalFusion.vision.visual_stability, fmt: (v: number) => `${v}/100` },
                          { label: 'Sample coverage', value: signalFusion.vision.sample_coverage != null ? Math.round(signalFusion.vision.sample_coverage * 100) : null, fmt: (v: number) => `${v}%` },
                          { label: 'Tracking loss', value: signalFusion.vision.tracking_loss_rate != null ? Math.round(signalFusion.vision.tracking_loss_rate * 100) : null, fmt: (v: number) => `${v}%`, invert: true },
                        ].filter(m => m.value != null).map((m) => (
                          <div key={m.label} style={{ background: 'var(--surface)', padding: '16px 20px' }}>
                            <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{m.label}</p>
                            <p style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace', marginBottom: '6px' }}>{m.fmt(m.value!)}</p>
                            <div style={{ height: '2px', background: 'var(--border)', borderRadius: '1px', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                width: `${m.value}%`,
                                background: (m as any).invert
                                  ? (m.value! <= 10 ? 'rgba(34,197,94,0.7)' : m.value! <= 30 ? 'var(--orange)' : '#ef4444')
                                  : (m.value! >= 70 ? 'rgba(34,197,94,0.7)' : m.value! >= 50 ? 'var(--orange)' : '#ef4444'),
                                borderRadius: '1px'
                              }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Signal Quality */}
                  {signalReliability && (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <AlertTriangle style={{ width: '13px', height: '13px', color: 'var(--text-4)' }} />
                        <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Signal quality
                        </p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                        {[
                          { label: 'Overall confidence', value: signalReliability.overall_confidence },
                          { label: 'Content confidence', value: signalReliability.content_confidence },
                          { label: 'Delivery confidence', value: signalReliability.delivery_confidence },
                          { label: 'Presence confidence', value: signalReliability.presence_confidence },
                        ].filter(m => m.value != null).map((m) => (
                          <div key={m.label} style={{ padding: '14px 16px', background: 'var(--surface-2)', borderRadius: '4px' }}>
                            <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                              {m.label}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${m.value * 100}%`, background: m.value >= 0.7 ? 'rgba(34,197,94,0.7)' : m.value >= 0.5 ? 'var(--orange)' : '#ef4444', borderRadius: '2px' }} />
                              </div>
                              <span style={{ fontSize: '12px', color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace' }}>
                                {Math.round(m.value * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {signalReliability.reason_flags?.length > 0 && (
                        <div>
                          <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                            Reason flags
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {signalReliability.reason_flags.map((flag: string) => (
                              <span key={flag} style={{ fontSize: '11px', color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '3px', padding: '3px 10px', fontFamily: 'IBM Plex Mono, monospace' }}>
                                {flag.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

/* ── Sub-components ─────────────────────────────────────────────────── */

const FlatTabButton = ({ id, label, icon: Icon, active, onClick }: any) => {
  const isActive = active === id;
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '12px 16px',
        fontSize: '13px',
        fontWeight: isActive ? 500 : 400,
        color: isActive ? 'var(--text)' : 'var(--text-4)',
        background: 'none',
        border: 'none',
        borderBottom: isActive ? '2px solid var(--orange)' : '2px solid transparent',
        cursor: 'pointer',
        transition: 'color 0.15s, border-color 0.15s',
        marginBottom: '-1px',
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-3)'; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-4)'; }}
    >
      <Icon style={{ width: '13px', height: '13px', color: isActive ? 'var(--orange)' : 'inherit' }} />
      {label}
    </button>
  );
};

const ReadinessTag = ({ signal, large }: { signal: 'strong' | 'developing' | 'limited'; large?: boolean }) => {
  const config = {
    strong: { label: 'Interview ready', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', color: 'rgba(74,222,128,0.9)' },
    developing: { label: 'Developing', bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)', color: 'rgba(253,224,71,0.9)' },
    limited: { label: 'Limited signal', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.15)', color: '#f87171' },
  }[signal];

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: large ? '8px 16px' : '4px 10px',
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: '4px',
      fontSize: large ? '13px' : '11px',
      color: config.color,
      fontFamily: 'IBM Plex Mono, monospace',
      letterSpacing: '0.04em',
    }}>
      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: config.color, flexShrink: 0 }} />
      {config.label}
    </div>
  );
};

const FlatScoreCard = ({ title, score, benchmark }: any) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
    <div>
      <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{title}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: '36px', fontWeight: 400, color: 'var(--text)', letterSpacing: '-0.02em', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>{score}</span>
        {benchmark && (
          <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>goal: {benchmark}</span>
        )}
      </div>
    </div>
    <div>
      <div style={{ height: '2px', background: 'var(--border)', borderRadius: '1px', overflow: 'hidden', marginBottom: '4px' }}>
        <div style={{ height: '100%', width: `${score}%`, background: getScoreColor(score), borderRadius: '1px' }} />
      </div>
      <p style={{ fontSize: '10px', color: 'var(--text-4)' }}>
        {benchmark ? (score >= benchmark ? 'Meeting target' : 'Below target') : 'Performance'}
      </p>
    </div>
  </div>
);

const FlatStatCard = ({ label, value, subtext, icon: Icon }: any) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', right: '16px', bottom: '16px', opacity: 0.12 }}>
      <Icon style={{ width: '18px', height: '18px', color: 'var(--text)' }} />
    </div>
    <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{label}</p>
    <p style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px', letterSpacing: '-0.01em' }}>{value}</p>
    <p style={{ fontSize: '11px', color: 'var(--text-4)' }}>{subtext}</p>
  </div>
);

const FlatSignalPanel = ({
  title, items, emptyCopy, tone
}: {
  title: string;
  items: Array<{ title: string; description: string }>;
  emptyCopy: string;
  tone: 'positive' | 'warning';
}) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '24px' }}>
    <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
      {title}
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {items.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>{emptyCopy}</p>}
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: tone === 'positive' ? 'rgba(34,197,94,0.5)' : 'rgba(232,101,26,0.5)', marginTop: '6px', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>{item.title}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-4)', lineHeight: '1.5' }}>{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FlatSimpleList = ({ title, items, accent }: { title: string; items: string[]; accent: 'green' | 'orange' }) => (
  <div>
    <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>
      {title}
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map((item, index) => (
        <div key={index} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: accent === 'green' ? 'rgba(34,197,94,0.4)' : 'rgba(232,101,26,0.4)', marginTop: '6px', flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.55' }}>{item}</p>
        </div>
      ))}
    </div>
  </div>
);

const FlatCalloutPanel = ({ label, title, body }: { label: string; title: string; body: string }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '24px' }}>
    <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
      {label}
    </p>
    <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text)', lineHeight: '1.4', marginBottom: '8px' }}>{title}</p>
    <p style={{ fontSize: '13px', color: 'var(--text-4)', lineHeight: '1.55' }}>{body}</p>
  </div>
);

const FlatEmptyPanel = ({ title, description }: { title: string; description: string }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '48px 24px', textAlign: 'center' }}>
    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-3)', marginBottom: '8px' }}>{title}</p>
    <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>{description}</p>
  </div>
);

const HighlightedText = ({ text }: { text: string }) => {
  const fillers = ['um', 'uh', 'like', 'actually', 'basically', 'really', 'just'];
  const weak = ['maybe', 'i think', 'sort of', 'kind of', 'might'];
  const words = text.split(/(\s+)/);
  return (
    <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.6' }}>
      {words.map((word, index) => {
        const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
        if (fillers.includes(cleanWord)) {
          return <span key={index} style={{ color: 'var(--text)', textDecoration: 'underline', textDecorationColor: 'rgba(239,68,68,0.4)', textUnderlineOffset: '3px', fontWeight: 500 }}>{word}</span>;
        }
        if (weak.includes(cleanWord)) {
          return <span key={index} style={{ color: 'var(--text)', textDecoration: 'underline', textDecorationColor: 'rgba(234,179,8,0.4)', textUnderlineOffset: '3px', fontStyle: 'italic' }}>{word}</span>;
        }
        return <span key={index}>{word}</span>;
      })}
    </p>
  );
};

const QuestionFeedbackCard = ({ feedback }: { feedback: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const score = feedback.contentAnalysis?.score ?? 0;

  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', transition: 'border-color 0.15s' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ width: '100%', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', padding: '2px 8px', border: '1px solid var(--border)', borderRadius: '3px' }}>
            Q{feedback.questionNumber}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500 }}>{feedback.overallAssessment}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: getScoreColor(score), fontFamily: 'IBM Plex Mono, monospace' }}>
            {score}%
          </span>
          <ChevronDown style={{ width: '14px', height: '14px', color: 'var(--text-4)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '16px 18px 18px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Delivery note
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.55' }}>"{feedback.deliveryNotes}"</p>
              </div>

              <div style={{ padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Coach suggestion</p>
                <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.55' }}>{feedback.suggestedAnswer}</p>
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(232,101,26,0.04)', border: '1px solid rgba(232,101,26,0.12)', borderRadius: '4px' }}>
                <p style={{ fontSize: '10px', color: 'var(--orange)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Key takeaway</p>
                <p style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500 }}>{feedback.keyTakeaway}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'rgba(34,197,94,0.8)';
  if (score >= 60) return 'var(--orange)';
  return '#ef4444';
}

function getGrade(score: number): { color: string; label: string } {
  if (score >= 90) return { color: 'rgba(34,197,94,0.9)', label: 'Offer-ready' };
  if (score >= 80) return { color: 'rgba(59,130,246,0.9)', label: 'Strong signal' };
  if (score >= 70) return { color: 'rgba(234,179,8,0.9)', label: 'Getting there' };
  if (score >= 60) return { color: 'var(--orange)', label: 'Gap identified' };
  return { color: '#ef4444', label: 'Not yet' };
}

export default InterviewResults;
