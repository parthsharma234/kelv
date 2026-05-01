import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, ChevronDown, Loader2, Mic, User, Zap, AlertTriangle,
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { InterviewMetrics } from '../../utils/analyticsEngine';
import { generateInterviewFeedback, InterviewFeedback } from '../../utils/openAIFeedback';
import { PerQuestionAnalysis } from '../../utils/perQuestionAnalytics';
import EnhancedCharts, { PostureAnalysisDisplay } from './EnhancedCharts';
import PerQuestionBreakdown from './PerQuestionBreakdown';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface InterviewResultsProps {
  sessionData: {
    metrics: InterviewMetrics;
    transcript: Array<{ role: 'user' | 'assistant' | 'system'; content: string; timestamp: Date | string; isPartial?: boolean }>;
    duration: number;
    perQuestionAnalysis?: PerQuestionAnalysis | null;
    postureData?: {
      shoulderAlignment: number;
      headPosition: 'centered' | 'forward' | 'tilted';
      overallScore: number;
      timeInGoodPosture: number;
      sampleCount?: number;
      samples?: Array<{
        timestamp: number;
        elapsedSeconds: number;
        metrics: {
          shoulderAlignment: number;
          headPosition: 'centered' | 'forward' | 'tilted';
          isGoodPosture: boolean;
          confidence: number;
          timestamp: number;
          keypoints?: Array<{
            name: string;
            x: number;
            y: number;
            score: number;
          }>;
          geometry?: {
            shoulderTiltDeg: number;
            headOffsetPct: number;
            torsoLeanDeg: number;
            shoulderWidthPct: number;
          };
        };
      }>;
    };
    jobContext?: { role?: string; industry?: string; experienceLevel?: string; jobDescription?: string };
    practicePlan?: any[];
    signalFusion?: any;
    signalReliability?: any;
    sessionResultV2?: any;
    recordingBlob?: Blob;
  };
  onBack: () => void;
}

type Tab = 'report' | 'signals';

const fmt = (v: number | null | undefined): string => v == null ? '--' : Math.round(v).toString();
const sc = (s: number) => s >= 80 ? 'rgba(34,197,94,0.85)' : s >= 60 ? 'var(--orange)' : '#f87171';

const InterviewResults: React.FC<InterviewResultsProps> = ({ sessionData, onBack }) => {
  const metrics = sessionData?.metrics;
  const transcript = sessionData?.transcript || [];
  const postureData = sessionData?.postureData;
  const jobContext = sessionData?.jobContext;
  const perQuestionAnalysis = sessionData?.perQuestionAnalysis || null;

  const practicePlan = useMemo(
    () => sessionData?.practicePlan || sessionData?.sessionResultV2?.recommended_drills || [],
    [sessionData]
  );
  const signalFusion = useMemo(
    () => sessionData?.signalFusion || sessionData?.sessionResultV2?.signal_fusion || null,
    [sessionData]
  );
  const signalReliability = useMemo(
    () => sessionData?.signalReliability || sessionData?.sessionResultV2?.signal_reliability || null,
    [sessionData]
  );
  const recordingBlob = sessionData?.recordingBlob;

  const v2 = sessionData?.sessionResultV2?.overall_scores ?? null;
  const overallScore: number | null = v2?.overall ?? metrics?.overallScore ?? null;
  const readiness: 'strong' | 'developing' | 'limited' | null = signalFusion?.fused?.interview_readiness_signal ?? null;
  const grade = getGrade(overallScore);

  const [tab, setTab] = useState<Tab>('report');
  const [aiFeedback, setAiFeedback] = useState<InterviewFeedback | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const qaPairs = useMemo(() => {
    const pairs: Array<{ question: string; answer: string; questionNumber: number }> = [];
    let pendingQuestion: string | null = null;

    for (const message of transcript) {
      if (message.role === 'assistant') {
        pendingQuestion = message.content;
        continue;
      }

      if (message.role === 'user' && pendingQuestion) {
        pairs.push({ question: pendingQuestion, answer: message.content, questionNumber: pairs.length + 1 });
        pendingQuestion = null;
      }
    }

    return pairs;
  }, [transcript]);

  const coachCtx = useMemo(() => ({ metrics, perQuestionAnalysis, practicePlan, signalFusion }), [metrics, perQuestionAnalysis, practicePlan, signalFusion]);
  const lensMarkers = useMemo(() => buildLensMarkers(metrics, postureData, signalFusion), [metrics, postureData, signalFusion]);

  // Load AI feedback as soon as we're on the report tab
  useEffect(() => {
    if (tab !== 'report' || loadingAI || aiFeedback || qaPairs.length === 0) return;
    const run = async () => {
      setLoadingAI(true); setAiError(null);
      try { setAiFeedback(await generateInterviewFeedback(qaPairs, jobContext, coachCtx)); }
      catch (error) {
        const message = error instanceof Error && error.message ? error.message : 'check OpenAI configuration or network';
        setAiError(`OpenAI question coaching unavailable: ${message}.`);
      }
      finally { setLoadingAI(false); }
    };
    run();
  }, [tab, aiFeedback, loadingAI, qaPairs, jobContext, coachCtx]);

  if (!metrics) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '15px', fontWeight: 500, color: '#f87171', marginBottom: '8px' }}>Results unavailable</p>
          <p style={{ fontSize: '13px', color: 'var(--text-4)', marginBottom: '24px' }}>Session data could not be loaded.</p>
          <button onClick={onBack} style={{ padding: '9px 20px', borderRadius: '6px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'pointer', fontSize: '13px' }}>Back</button>
        </div>
      </div>
    );
  }

  const dur = sessionData?.duration || 0;
  const durStr = dur >= 60 ? `${Math.floor(dur / 60)}m ${dur % 60}s` : `${dur}s`;
  const topDrill = practicePlan?.[0] ?? null;
  const strengths = metrics.strengths || [];
  const weaknesses = metrics.weaknesses || [];

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#62666d', font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { color: '#62666d', font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 } },
    },
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 20, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-4)')}>
            <ArrowLeft style={{ width: '14px', height: '14px' }} />
            Back
          </button>
          <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>Interview Review</span>
          {jobContext?.role && (
            <span style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>
              · {jobContext.role}{jobContext.experienceLevel ? ` · ${jobContext.experienceLevel}` : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {(['report', 'signals'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 500, borderRadius: '5px', cursor: 'pointer', transition: 'all 0.15s', border: '1px solid', background: tab === t ? 'var(--surface-2)' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--text-4)', borderColor: tab === t ? 'var(--border)' : 'transparent' }}>
              {t === 'report' ? 'Report' : 'Signals'}
            </button>
          ))}
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence mode="wait">

          {/* ══════════════════════════════════
               REPORT TAB
          ══════════════════════════════════ */}
          {tab === 'report' && (
            <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

              {/* Body */}
              <div style={{ maxWidth: '1480px', margin: '0 auto', padding: '36px 40px 52px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '28px', alignItems: 'start' }}>
                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '36px' }}>

                {/* ── Coaching summary ── */}
                {false && (<React.Fragment>
                <section>
                  <SectionLabel>What Kelv heard</SectionLabel>

                  {/* Signal snapshot — data-backed context row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', marginBottom: '28px' }}>
                    {[
                      {
                        dim: 'Content',
                        score: fmt(v2?.content ?? metrics.contentScore ?? null),
                        note: (() => {
                          const s = v2?.content ?? metrics.contentScore ?? null;
                          if (s == null) return 'Not scored';
                          if (s >= 80) return 'Strong structure and specificity';
                          if (s >= 65) return 'Needs sharper evidence';
                          return 'Structure and proof are thin';
                        })(),
                      },
                      {
                        dim: 'Delivery',
                        score: fmt(v2?.delivery ?? metrics.deliveryScore ?? null),
                        note: metrics.wpm > 0
                          ? `${Math.round(metrics.wpm)} wpm · ${metrics.fillerWordCount ?? 0} fillers`
                          : 'Voice signals not captured',
                      },
                      {
                        dim: 'Presence',
                        score: fmt(v2?.presence ?? metrics.presenceScore ?? null),
                        note: postureData
                          ? `${postureData.timeInGoodPosture}% good posture · head ${postureData.headPosition}`
                          : 'Camera tracking not enabled',
                      },
                    ].map((d) => (
                      <div key={d.dim} style={{ background: 'var(--surface)', padding: '16px 18px' }}>
                        <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{d.dim}</p>
                        <p style={{ fontSize: '20px', fontWeight: 400, color: d.score === '--' ? 'var(--text-4)' : 'var(--text)', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px' }}>{d.score}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-4)', lineHeight: '1.4' }}>{d.note}</p>
                      </div>
                    ))}
                  </div>

                  {/* AI coaching narrative */}
                  {loadingAI && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                      <Loader2 style={{ width: '12px', height: '12px', color: 'var(--text-4)', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>reading session…</span>
                    </div>
                  )}

                  {aiError && (
                    <div style={{ marginBottom: '16px', padding: '9px 13px', background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.12)', borderRadius: '5px', fontSize: '11px', color: 'rgba(253,224,71,0.7)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <AlertTriangle style={{ width: '11px', height: '11px', flexShrink: 0, marginTop: '1px' }} />
                      {aiError}
                    </div>
                  )}

                  {aiFeedback && (
                    <p style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: '1.75', marginBottom: '28px' }}>
                      {aiFeedback.overallSummary}
                    </p>
                  )}

                  {!aiFeedback && !loadingAI && Array.isArray(signalFusion?.fused?.coaching_focus) && signalFusion.fused.coaching_focus.length > 0 && (
                    <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {signalFusion.fused.coaching_focus.map((note: string, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', paddingTop: '3px', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                          <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.6' }}>{note}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* #1 thing to fix — prominent */}
                  {(aiFeedback?.criticalImprovements?.[0] || weaknesses[0]?.description) && (
                    <div style={{ marginBottom: '28px', padding: '16px 20px', background: 'rgba(232,101,26,0.04)', border: '1px solid rgba(232,101,26,0.12)', borderRadius: '6px' }}>
                      <p style={{ fontSize: '10px', color: 'var(--orange)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Biggest lever</p>
                      <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.6' }}>
                        {aiFeedback?.criticalImprovements?.[0] ?? weaknesses[0]?.description}
                      </p>
                    </div>
                  )}

                  {/* Strengths / remaining gaps side by side */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <p style={{ fontSize: '10px', color: 'rgba(74,222,128,0.7)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>What's working</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                        {(aiFeedback?.topStrengths?.length ? aiFeedback.topStrengths : strengths.slice(0, 3).map(s => s.description)).length > 0
                          ? (aiFeedback?.topStrengths?.length ? aiFeedback.topStrengths : strengths.slice(0, 3).map(s => s.description)).map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(34,197,94,0.5)', marginTop: '8px', flexShrink: 0 }} />
                              <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.55' }}>{item}</p>
                            </div>
                          ))
                          : <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>No standout strengths detected yet.</p>
                        }
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Also to fix</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                        {(aiFeedback?.criticalImprovements?.slice(1)?.length ? aiFeedback.criticalImprovements.slice(1) : weaknesses.slice(1, 4).map(w => w.description)).length > 0
                          ? (aiFeedback?.criticalImprovements?.slice(1)?.length ? aiFeedback.criticalImprovements.slice(1) : weaknesses.slice(1, 4).map(w => w.description)).map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(155,155,155,0.3)', marginTop: '8px', flexShrink: 0 }} />
                              <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.55' }}>{item}</p>
                            </div>
                          ))
                          : <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>No additional issues flagged.</p>
                        }
                      </div>
                    </div>
                  </div>
                </section>

                <Divider />

                {/* ── Question by question ── */}
                </React.Fragment>)}

                <section>
                  <SectionLabel>Question by question</SectionLabel>
                  {perQuestionAnalysis && perQuestionAnalysis.questions.length > 0 ? (
                    <PerQuestionBreakdown
                      analysis={perQuestionAnalysis}
                      questionFeedback={aiFeedback?.questionFeedback || []}
                      loadingFeedback={loadingAI}
                      feedbackError={aiError}
                    />
                  ) : qaPairs.length > 0 ? (
                    /* Fallback: show raw QA pairs with transcript highlighting */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                      {qaPairs.map((pair, i) => (
                        <RawQACard
                          key={i}
                          pair={pair}
                          isLast={i === qaPairs.length - 1}
                          coaching={aiFeedback?.questionFeedback?.find(f => f.questionNumber === pair.questionNumber)}
                          loadingFeedback={loadingAI}
                          feedbackError={aiError}
                        />
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                      <p style={{ fontSize: '14px', color: 'var(--text-4)' }}>Complete a full session to see question-by-question feedback.</p>
                    </div>
                  )}
                </section>

                {/* ── AI question coaching (if available) ── */}
                {false && (<React.Fragment>
                {aiFeedback && aiFeedback.questionFeedback.length > 0 && !perQuestionAnalysis && (
                  <>
                    <Divider />
                    <section>
                      <SectionLabel>Answer-by-answer coaching</SectionLabel>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {aiFeedback.questionFeedback.map((fb, i) => (
                          <QuestionFeedbackCard key={i} feedback={fb} />
                        ))}
                      </div>
                    </section>
                  </>
                )}

                <Divider />

                {/* ── Next session ── */}
                <section>
                  <SectionLabel>For your next session</SectionLabel>

                  {aiFeedback?.nextSteps && aiFeedback.nextSteps.length > 0 && (
                    <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                      {aiFeedback.nextSteps.map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: '16px', padding: '12px 16px', background: 'var(--surface)', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', paddingTop: '3px', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                          <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.55' }}>{step}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {topDrill && (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
                      <div>
                        <p style={{ fontSize: '10px', color: 'var(--orange)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Recommended drill</p>
                        <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>{(topDrill.drill_type || topDrill.drillType)?.replace(/-/g, ' ') || 'Focused practice'}</p>
                        {(topDrill.weak_point || topDrill.weakPoint) && <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>Focus: {topDrill.weak_point || topDrill.weakPoint}</p>}
                        {(topDrill.completion_criteria || topDrill.completionCriteria) && <p style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '6px', lineHeight: '1.5' }}>Pass when: {topDrill.completion_criteria || topDrill.completionCriteria}</p>}
                      </div>
                      {(topDrill.repetition_target || topDrill.repetitionTarget) && (
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: '32px', fontWeight: 300, color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>{topDrill.repetition_target || topDrill.repetitionTarget}×</p>
                          <p style={{ fontSize: '10px', color: 'var(--text-4)', marginTop: '2px' }}>reps target</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!topDrill && !aiFeedback?.nextSteps?.length && (
                    <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>Complete a full session to unlock personalized practice recommendations.</p>
                  )}
                </section>
                </React.Fragment>)}
                </div>

                <KelvLensPanel
                  postureData={postureData}
                  signalFusion={signalFusion}
                  recordingBlob={recordingBlob}
                  markers={lensMarkers}
                />
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════
               SIGNALS TAB
          ══════════════════════════════════ */}
          {tab === 'signals' && (
            <motion.div key="signals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              style={{ maxWidth: '860px', margin: '0 auto', padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

              {/* Delivery */}
              <section>
                <SectionLabel icon={<Mic style={{ width: '12px', height: '12px' }} />}>Delivery</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  {[
                    { label: 'Delivery score', value: fmt(v2?.delivery ?? metrics.deliveryScore ?? null), sub: 'Pace, clarity, fillers' },
                    { label: 'Pace', value: metrics.wpm > 0 ? `${Math.round(metrics.wpm)} wpm` : '--', sub: 'Target: 110–160 wpm' },
                    { label: 'Filler words', value: fmt(metrics.fillerWordCount), sub: (metrics.fillerWordCount ?? 0) > 5 ? 'Needs cleanup' : 'Under control' },
                    { label: 'Cadence variety', value: metrics.tonalVariety > 0 ? `${metrics.tonalVariety}/100` : '--', sub: metrics.tonalVariety >= 70 ? 'Good range' : metrics.tonalVariety > 0 ? 'Flat — vary your pace' : 'Not measured' },
                  ].map((d) => <SignalTile key={d.label} {...d} />)}
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '20px' }}>
                  <EnhancedCharts metrics={metrics} />
                </div>
              </section>

              <Divider />

              {/* Presence */}
              <section>
                <SectionLabel icon={<User style={{ width: '12px', height: '12px' }} />}>Presence</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  {[
                    { label: 'Presence score', value: fmt(v2?.presence ?? metrics.presenceScore ?? null), sub: postureData ? 'Posture-backed' : 'Proxy estimate' },
                    { label: 'Good posture time', value: postureData ? `${postureData.timeInGoodPosture}%` : '--', sub: postureData ? 'Tracked live' : 'Not captured' },
                    { label: 'Posture score', value: postureData ? `${postureData.overallScore}%` : '--', sub: postureData ? `Head: ${postureData.headPosition}` : 'Camera tracking off' },
                    { label: 'Hesitation', value: metrics.anxietyLevel > 0 ? (metrics.anxietyLevel > 40 ? 'High' : metrics.anxietyLevel > 20 ? 'Moderate' : 'Low') : '--', sub: metrics.anxietyLevel > 0 ? `${metrics.anxietyLevel}/100 · proxy` : 'Not measured' },
                  ].map((d) => <SignalTile key={d.label} {...d} />)}
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '20px' }}>
                  <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Presence trend</p>
                  <div style={{ height: '180px' }}>
                    <Line options={chartOpts} data={{
                      labels: metrics.timeline.map(p => p.timestamp),
                      datasets: [{ label: 'Presence', data: metrics.timeline.map(p => p.faceConfidence * 100), borderColor: '#10b981', backgroundColor: '#10b98120', fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2 }],
                    }} />
                  </div>
                  {postureData && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', height: '160px' }}>
                      <PostureAnalysisDisplay postureData={postureData} />
                    </div>
                  )}
                </div>
              </section>

              {/* LENS / voice fusion */}
              {signalFusion && (
                <>
                  <Divider />
                  <section>
                    <SectionLabel icon={<Zap style={{ width: '12px', height: '12px' }} />}>LENS · Local signal fusion</SectionLabel>

                    {signalFusion.voice && (
                      <div style={{ marginBottom: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Voice analysis</p>
                          {signalFusion.voice.audio_source && (
                            <span style={{ fontSize: '10px', color: signalFusion.voice.audio_source === 'recording_blob' ? 'rgba(74,222,128,0.8)' : 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', padding: '2px 8px', background: signalFusion.voice.audio_source === 'recording_blob' ? 'rgba(34,197,94,0.08)' : 'var(--surface-2)', border: `1px solid ${signalFusion.voice.audio_source === 'recording_blob' ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`, borderRadius: '3px' }}>
                              {signalFusion.voice.audio_source === 'recording_blob' ? 'recording-backed' : 'transcript proxy'}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)' }}>
                          {[
                            { label: 'Pace', value: signalFusion.voice.pace_score },
                            { label: 'Filler control', value: signalFusion.voice.filler_control },
                            { label: 'Pause control', value: signalFusion.voice.pause_control },
                            { label: 'Articulation', value: signalFusion.voice.articulation_proxy },
                            { label: 'Clarity', value: signalFusion.voice.clarity_score },
                            { label: 'Fluency', value: signalFusion.voice.fluency_score },
                          ].filter(m => m.value != null).map(m => (
                            <LensCell key={m.label} label={m.label} value={m.value} />
                          ))}
                        </div>
                      </div>
                    )}

                    {signalFusion.vision && (
                      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Camera analysis</p>
                          {signalFusion.vision.sample_count != null && (
                            <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>{signalFusion.vision.sample_count} samples</span>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)' }}>
                          {[
                            { label: 'Posture', value: signalFusion.vision.posture_score, invert: false },
                            { label: 'Head centering', value: signalFusion.vision.head_centering, invert: false },
                            { label: 'Visual stability', value: signalFusion.vision.visual_stability, invert: false },
                            { label: 'Sample coverage', value: signalFusion.vision.sample_coverage != null ? Math.round(signalFusion.vision.sample_coverage * 100) : null, invert: false },
                            { label: 'Tracking loss', value: signalFusion.vision.tracking_loss_rate != null ? Math.round(signalFusion.vision.tracking_loss_rate * 100) : null, invert: true },
                          ].filter(m => m.value != null).map(m => (
                            <LensCell key={m.label} label={m.label} value={m.value!} invert={m.invert} />
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                </>
              )}

              {/* Signal reliability */}
              {signalReliability && (
                <>
                  <Divider />
                  <section>
                    <SectionLabel>Signal reliability</SectionLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      {[
                        { label: 'Overall', value: signalReliability.overall_confidence },
                        { label: 'Content', value: signalReliability.content_confidence },
                        { label: 'Delivery', value: signalReliability.delivery_confidence },
                        { label: 'Presence', value: signalReliability.presence_confidence },
                      ].filter(m => m.value != null).map(m => (
                        <div key={m.label} style={{ padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '5px' }}>
                          <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{m.label}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '2px', background: 'var(--border)', borderRadius: '1px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${m.value * 100}%`, background: m.value >= 0.7 ? 'rgba(34,197,94,0.7)' : m.value >= 0.5 ? 'var(--orange)' : '#f87171' }} />
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace' }}>{Math.round(m.value * 100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {signalReliability.reason_flags?.length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {signalReliability.reason_flags.map((flag: string) => (
                          <span key={flag} style={{ fontSize: '11px', color: 'var(--text-4)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '3px 10px', fontFamily: 'IBM Plex Mono, monospace' }}>
                            {flag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}

            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

/* ── Layout primitives ── */

const SectionLabel = ({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
    {icon && <span style={{ color: 'var(--text-4)' }}>{icon}</span>}
    <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{children}</p>
    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
  </div>
);

const Divider = () => <div style={{ height: '1px', background: 'var(--border)' }} />;

/* ── Signal tile (signals tab) ── */
type PostureSnapshot = NonNullable<InterviewResultsProps['sessionData']['postureData']>;
type LensMarker = {
  kind: 'audio' | 'posture';
  time: string;
  label: string;
  evidence: string;
  action: string;
  tone: 'green' | 'orange' | 'red';
};

const KelvLensPanel = ({
  postureData,
  signalFusion,
  recordingBlob,
  markers,
}: {
  postureData?: PostureSnapshot;
  signalFusion: any;
  recordingBlob?: Blob;
  markers: { audio: LensMarker[]; posture: LensMarker[] };
}) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const cameraSource = postureData ? `${postureData.sampleCount ?? postureData.samples?.length ?? 0} pose samples` : 'pose signal not captured';
  const worstSample = getWorstPostureSample(postureData);
  const geometry = worstSample?.metrics.geometry;

  useEffect(() => {
    if (!recordingBlob) {
      setMediaUrl(null);
      return;
    }
    const url = URL.createObjectURL(recordingBlob);
    setMediaUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [recordingBlob]);

  return (
    <aside style={{ position: 'sticky', top: '76px', alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '8px' }}>
          <div>
            <p style={{ fontSize: '10px', color: 'var(--orange)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '6px' }}>Kelv LENS</p>
            <h2 style={{ fontSize: '20px', lineHeight: 1.1, fontWeight: 500, letterSpacing: '-0.035em', color: 'var(--text)' }}>Posture replay.</h2>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', border: '1px solid rgba(232,101,26,0.35)', display: 'grid', placeItems: 'center', color: 'var(--orange)', background: 'rgba(232,101,26,0.08)' }}>
            <Zap style={{ width: '17px', height: '17px' }} />
          </div>
        </div>
        <p style={{ fontSize: '12px', lineHeight: '1.55', color: 'var(--text-4)' }}>MoveNet keypoints, shoulder angle, head offset, and torso lean from the recorded session.</p>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Posture replay</p>
            <p style={{ fontSize: '12px', color: 'var(--text-4)' }}>{cameraSource}</p>
          </div>
          <User style={{ width: '14px', height: '14px', color: 'var(--text-4)' }} />
        </div>

        <div style={{ padding: '18px', display: 'grid', gridTemplateColumns: '112px 1fr', gap: '16px', alignItems: 'center' }}>
          <PostureMiniMap sample={worstSample} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.5' }}>Ideal: level shoulders, centered head, vertical torso.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <MiniMetric label="Shoulder tilt" value={geometry ? `${geometry.shoulderTiltDeg}°` : '--'} />
              <MiniMetric label="Head offset" value={geometry ? `${Math.round(geometry.headOffsetPct)}%` : '--'} />
              <MiniMetric label="Torso lean" value={geometry ? `${geometry.torsoLeanDeg}°` : '--'} />
              <MiniMetric label="Stable time" value={postureData ? `${postureData.timeInGoodPosture}%` : '--'} />
            </div>
          </div>
        </div>

        <PostureReplay mediaUrl={mediaUrl} postureData={postureData} />

        <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {markers.posture.map((marker, i) => <LensMarkerRow key={`${marker.label}-${i}`} marker={marker} />)}
        </div>
      </div>

    </aside>
  );
};

const LensReviewCard = ({
  title,
  icon,
  source,
  metrics,
  markers,
  mediaUrl,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  source: string;
  metrics: InterviewMetrics;
  markers: LensMarker[];
  mediaUrl?: string | null;
  empty: string;
}) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
    <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
      <div>
        <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{title}</p>
        <p style={{ fontSize: '12px', color: 'var(--text-4)' }}>{source}</p>
      </div>
      <span style={{ color: 'var(--text-4)' }}>{icon}</span>
    </div>
    <div style={{ padding: '14px 18px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {mediaUrl && (
        <audio src={mediaUrl} controls style={{ width: '100%', height: '34px', marginBottom: '4px' }} />
      )}
      <VoiceSignalWaveform metrics={metrics} markers={markers} />
      {markers.length > 0 ? markers.map((marker, i) => <LensMarkerRow key={`${marker.label}-${i}`} marker={marker} />) : (
        <p style={{ fontSize: '12px', color: 'var(--text-4)', lineHeight: '1.55' }}>{empty}</p>
      )}
    </div>
  </div>
);

const VoiceSignalWaveform = ({ metrics, markers }: { metrics: InterviewMetrics; markers: LensMarker[] }) => {
  const timeline = metrics.timeline?.length ? metrics.timeline : Array.from({ length: 28 }, (_, i) => ({
    timestamp: `${i}`,
    voiceConfidence: metrics.deliveryScore ? metrics.deliveryScore / 100 : 0.45,
    faceConfidence: 0,
    dominantEmotion: 'neutral',
    emotionIntensity: 0,
  }));
  const bars = timeline.slice(0, 42);
  const orangeSlots = new Set(markers.filter(marker => marker.tone !== 'green').map((_, i) => Math.min(bars.length - 1, Math.floor(((i + 1) / (markers.length + 1)) * bars.length))));

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', background: '#080909', padding: '14px 12px', marginBottom: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Voice trace</p>
          <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '3px' }}>{Math.round(metrics.wpm || 0)} WPM · {metrics.fillerWordCount ?? 0} fillers</p>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--orange)', fontFamily: 'IBM Plex Mono, monospace' }}>orange = review</span>
      </div>
      <div style={{ height: '54px', display: 'flex', alignItems: 'center', gap: '3px' }}>
        {bars.map((point, i) => {
          const confidence = Math.max(0.08, Math.min(1, point.voiceConfidence || 0.2));
          const height = 18 + confidence * 76;
          const flagged = orangeSlots.has(i) || confidence < 0.45;
          return (
            <div
              key={`${point.timestamp}-${i}`}
              title={`${point.timestamp}: ${Math.round(confidence * 100)}% voice confidence`}
              style={{
                flex: 1,
                height: `${height}%`,
                borderRadius: '2px',
                background: flagged ? 'var(--orange)' : 'rgba(255,255,255,0.14)',
                boxShadow: flagged ? '0 0 14px rgba(232,101,26,0.28)' : 'none',
                alignSelf: 'center',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

const PostureReplay = ({ mediaUrl, postureData }: { mediaUrl: string | null; postureData?: PostureSnapshot }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const activeSample = getNearestPostureSample(postureData, currentTime);

  return (
    <div style={{ padding: '0 18px 16px' }}>
      <div style={{ position: 'relative', borderRadius: '10px', border: '1px solid var(--border)', background: '#050505', overflow: 'hidden', minHeight: '220px' }}>
        {mediaUrl ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            controls
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            style={{ width: '100%', display: 'block', background: '#050505' }}
          />
        ) : (
          <div style={{ height: '220px', display: 'grid', placeItems: 'center', padding: '24px', textAlign: 'center' }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500, marginBottom: '6px' }}>No replay video attached</p>
              <p style={{ fontSize: '12px', color: 'var(--text-4)', lineHeight: '1.5' }}>Kelv LENS has posture samples, but this session did not persist the camera recording.</p>
            </div>
          </div>
        )}
        <PostureLandmarkOverlay sample={activeSample} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
        <MiniMetric label="Current tilt" value={activeSample?.metrics.geometry ? `${activeSample.metrics.geometry.shoulderTiltDeg}°` : '--'} />
        <MiniMetric label="Ideal tilt" value="< 4°" />
      </div>
    </div>
  );
};

const PostureLandmarkOverlay = ({ sample }: { sample?: NonNullable<PostureSnapshot['samples']>[number] }) => {
  const keypoints = sample?.metrics.keypoints || [];
  const hasPose = keypoints.some((point) => point.score > 0.25);
  const color = sample?.metrics.isGoodPosture ? 'rgba(34,197,94,0.9)' : 'rgba(232,101,26,0.96)';
  const geometry = sample?.metrics.geometry;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <rect x="29" y="12" width="42" height="66" rx="4" fill="none" stroke="rgba(34,197,94,0.35)" strokeDasharray="2 2" strokeWidth="0.7" />
      {hasPose ? <PoseSkeleton keypoints={keypoints} color={color} /> : (
        <text x="50" y="50" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="4.5" fontFamily="IBM Plex Mono, monospace">no pose keypoints captured</text>
      )}
      {geometry && (
        <>
          <text x="4" y="91" fill={color} fontSize="3.7" fontFamily="IBM Plex Mono, monospace">
            shoulder {geometry.shoulderTiltDeg}deg
          </text>
          <text x="4" y="96" fill={color} fontSize="3.7" fontFamily="IBM Plex Mono, monospace">
            head {Math.round(geometry.headOffsetPct)}% · torso {geometry.torsoLeanDeg}deg
          </text>
        </>
      )}
      <text x="68" y="94" fill="rgba(34,197,94,0.82)" fontSize="3.7" fontFamily="IBM Plex Mono, monospace">
        ideal: level + centered
      </text>
    </svg>
  );
};

const PoseSkeleton = ({
  keypoints,
  color = 'rgba(232,101,26,0.96)',
  compact = false,
}: {
  keypoints: Array<{ name: string; x: number; y: number; score: number }>;
  color?: string;
  compact?: boolean;
}) => {
  const pointByName = new Map(keypoints.map((point) => [point.name, point]));
  const connections = [
    ['left_shoulder', 'right_shoulder'],
    ['left_shoulder', 'left_elbow'],
    ['left_elbow', 'left_wrist'],
    ['right_shoulder', 'right_elbow'],
    ['right_elbow', 'right_wrist'],
    ['left_shoulder', 'left_hip'],
    ['right_shoulder', 'right_hip'],
    ['left_hip', 'right_hip'],
    ['left_hip', 'left_knee'],
    ['right_hip', 'right_knee'],
    ['left_eye', 'right_eye'],
    ['left_ear', 'left_eye'],
    ['right_ear', 'right_eye'],
  ];
  const visible = (name: string) => {
    const point = pointByName.get(name);
    return point && point.score > 0.25 ? point : null;
  };
  const toSvg = (point: { x: number; y: number }) => ({ x: point.x * 100, y: point.y * 100 });
  const strokeWidth = compact ? 1.6 : 1.2;

  return (
    <g>
      {connections.map(([from, to]) => {
        const a = visible(from);
        const b = visible(to);
        if (!a || !b) return null;
        const av = toSvg(a);
        const bv = toSvg(b);
        return (
          <line
            key={`${from}-${to}`}
            x1={av.x}
            y1={av.y}
            x2={bv.x}
            y2={bv.y}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={Math.min(a.score, b.score)}
          />
        );
      })}
      {keypoints.filter((point) => point.score > 0.25).map((point) => {
        const p = toSvg(point);
        return (
          <circle
            key={point.name}
            cx={p.x}
            cy={p.y}
            r={compact ? 1.8 : 1.25}
            fill={color}
            opacity={Math.max(0.38, point.score)}
          />
        );
      })}
    </g>
  );
};

const LensMarkerRow = ({ marker }: { marker: LensMarker }) => {
  const color = marker.tone === 'green' ? 'rgba(34,197,94,0.75)' : marker.tone === 'red' ? '#f87171' : 'var(--orange)';
  const bg = marker.tone === 'green' ? 'rgba(34,197,94,0.06)' : marker.tone === 'red' ? 'rgba(239,68,68,0.07)' : 'rgba(232,101,26,0.08)';
  const border = marker.tone === 'green' ? 'rgba(34,197,94,0.18)' : marker.tone === 'red' ? 'rgba(239,68,68,0.18)' : 'rgba(232,101,26,0.22)';
  return (
    <div style={{ border: `1px solid ${border}`, background: bg, borderRadius: '7px', padding: '11px 12px', display: 'grid', gridTemplateColumns: '48px 1fr', gap: '10px' }}>
      <div style={{ fontSize: '11px', color, fontFamily: 'IBM Plex Mono, monospace', paddingTop: '2px' }}>{marker.time}</div>
      <div>
        <p style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500, marginBottom: '3px' }}>{marker.label}</p>
        <p style={{ fontSize: '12px', color: 'var(--text-4)', lineHeight: '1.45', marginBottom: '6px' }}>{marker.evidence}</p>
        <p style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: '1.45' }}>{marker.action}</p>
      </div>
    </div>
  );
};

const MiniMetric = ({ label, value }: { label: string; value: string }) => (
  <div style={{ padding: '9px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface-2)' }}>
    <p style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</p>
    <p style={{ fontSize: '14px', color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace' }}>{value}</p>
  </div>
);

const ReliabilityBar = ({ label, value }: { label: string; value?: number }) => {
  const pct = value == null ? null : Math.round(value * 100);
  const color = pct == null ? 'var(--text-4)' : pct >= 70 ? 'rgba(34,197,94,0.7)' : pct >= 50 ? 'var(--orange)' : '#f87171';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '5px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>{label}</span>
        <span style={{ fontSize: '11px', color, fontFamily: 'IBM Plex Mono, monospace' }}>{pct == null ? '--' : `${pct}%`}</span>
      </div>
      <div style={{ height: '2px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
        {pct != null && <div style={{ height: '100%', width: `${pct}%`, background: color }} />}
      </div>
    </div>
  );
};

const PostureMiniMap = ({ sample }: { sample?: NonNullable<PostureSnapshot['samples']>[number] }) => {
  const keypoints = sample?.metrics.keypoints || [];
  const hasPose = keypoints.some((point) => point.score > 0.25);
  return (
    <div style={{ height: '132px', border: '1px solid var(--border)', borderRadius: '10px', background: '#080909', position: 'relative', overflow: 'hidden' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect x="18" y="10" width="64" height="78" rx="4" fill="none" stroke="rgba(34,197,94,0.25)" strokeDasharray="2 2" strokeWidth="0.8" />
        {hasPose ? <PoseSkeleton keypoints={keypoints} compact /> : (
          <text x="50" y="52" textAnchor="middle" fill="rgba(255,255,255,0.38)" fontSize="5" fontFamily="IBM Plex Mono, monospace">no keypoints</text>
        )}
      </svg>
    </div>
  );
};

const SignalTile = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '16px 18px' }}>
    <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</p>
    <p style={{ fontSize: '22px', fontWeight: 400, color: value === '--' ? 'var(--text-4)' : 'var(--text)', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '-0.01em', lineHeight: 1, marginBottom: '4px' }}>{value}</p>
    <p style={{ fontSize: '11px', color: 'var(--text-4)' }}>{sub}</p>
  </div>
);

/* ── LENS metric cell ── */
const LensCell = ({ label, value, invert }: { label: string; value: number; invert?: boolean }) => {
  const barColor = invert
    ? (value <= 10 ? 'rgba(34,197,94,0.7)' : value <= 30 ? 'var(--orange)' : '#f87171')
    : (value >= 70 ? 'rgba(34,197,94,0.7)' : value >= 50 ? 'var(--orange)' : '#f87171');
  return (
    <div style={{ background: 'var(--surface)', padding: '14px 16px' }}>
      <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace', marginBottom: '6px' }}>{value}/100</p>
      <div style={{ height: '2px', background: 'var(--border)', borderRadius: '1px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: barColor }} />
      </div>
    </div>
  );
};

/* ── Readiness tag ── */
const ReadinessTag = ({ signal }: { signal: 'strong' | 'developing' | 'limited' }) => {
  const cfg = {
    strong: { label: 'Interview ready', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', color: 'rgba(74,222,128,0.9)' },
    developing: { label: 'Developing', bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)', color: 'rgba(253,224,71,0.9)' },
    limited: { label: 'Limited signal', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.15)', color: '#f87171' },
  }[signal];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '4px', fontSize: '11px', color: cfg.color, fontFamily: 'IBM Plex Mono, monospace' }}>
      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.color }} />
      {cfg.label}
    </div>
  );
};

/* ── Raw QA card (fallback when no per-question analysis) ── */
const RawQACard = ({
  pair,
  isLast,
  coaching,
  loadingFeedback,
  feedbackError,
}: {
  pair: any;
  isLast: boolean;
  coaching?: any;
  loadingFeedback?: boolean;
  feedbackError?: string | null;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: 'var(--surface)', borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', padding: '2px 7px', border: '1px solid var(--border)', borderRadius: '3px', flexShrink: 0, marginTop: '2px' }}>Q{pair.questionNumber}</span>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.5' }}>{pair.question}</p>
        </div>
        <ChevronDown style={{ width: '13px', height: '13px', color: 'var(--text-4)', flexShrink: 0, marginTop: '3px', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Your answer</p>
                <HighlightedText text={pair.answer} />
              </div>
              {loadingFeedback && !coaching && (
                <div style={{ padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 style={{ width: '12px', height: '12px', color: 'var(--text-4)', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                  <p style={{ fontSize: '12px', color: 'var(--text-4)', lineHeight: '1.55' }}>Reading this answer with OpenAI...</p>
                </div>
              )}
              {feedbackError && !coaching && !loadingFeedback && (
                <div style={{ padding: '12px 14px', background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.14)', borderRadius: '4px' }}>
                  <p style={{ fontSize: '10px', color: 'rgba(253,224,71,0.8)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Coaching unavailable</p>
                  <p style={{ fontSize: '12px', color: 'rgba(253,224,71,0.72)', lineHeight: '1.55' }}>{feedbackError}</p>
                </div>
              )}
              {coaching && (
                <div style={{ padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                  <p style={{ fontSize: '10px', color: 'var(--orange)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Coaching note</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.55' }}>{coaching.shortDiagnosis || coaching.nextRep}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Question feedback card (AI coaching per question) ── */
const QuestionFeedbackCard = ({ feedback }: { feedback: any }) => {
  const [open, setOpen] = useState(false);
  const score: number | null = feedback.scores?.overall ?? null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', padding: '2px 7px', border: '1px solid var(--border)', borderRadius: '3px' }}>Q{feedback.questionNumber}</span>
          <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500 }}>{feedback.shortDiagnosis}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {score != null && <span style={{ fontSize: '13px', color: sc(score), fontFamily: 'IBM Plex Mono, monospace' }}>{score}%</span>}
          <ChevronDown style={{ width: '13px', height: '13px', color: 'var(--text-4)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Coaching suggestion</p>
                <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.55' }}>{feedback.suggestedAnswerSkeleton || feedback.nextRep}</p>
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(232,101,26,0.04)', border: '1px solid rgba(232,101,26,0.12)', borderRadius: '4px' }}>
                <p style={{ fontSize: '10px', color: 'var(--orange)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Key takeaway</p>
                <p style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500 }}>{feedback.nextRep || feedback.toImprove?.[0]?.note}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Filler word highlighter ── */
const HighlightedText = ({ text }: { text: string }) => {
  const fillers = new Set(['um', 'uh', 'like', 'actually', 'basically', 'really', 'just']);
  const weak = new Set(['maybe', 'sort', 'kind', 'might']);
  return (
    <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.65' }}>
      {text.split(/(\s+)/).map((word, i) => {
        const clean = word.toLowerCase().replace(/[^a-z]/g, '');
        if (fillers.has(clean)) return <span key={i} style={{ color: 'var(--text)', textDecoration: 'underline', textDecorationColor: 'rgba(239,68,68,0.4)', textUnderlineOffset: '3px', fontWeight: 500 }}>{word}</span>;
        if (weak.has(clean)) return <span key={i} style={{ color: 'var(--text)', textDecoration: 'underline', textDecorationColor: 'rgba(234,179,8,0.4)', textUnderlineOffset: '3px', fontStyle: 'italic' }}>{word}</span>;
        return <span key={i}>{word}</span>;
      })}
    </p>
  );
};

/* ── Helpers ── */
function buildLensMarkers(
  metrics: InterviewMetrics | undefined,
  postureData: PostureSnapshot | undefined,
  signalFusion: any
): { audio: LensMarker[]; posture: LensMarker[] } {
  const audio: LensMarker[] = [];
  const posture: LensMarker[] = [];

  if (metrics) {
    const lowestVoice = [...(metrics.timeline || [])]
      .filter(point => point.voiceConfidence != null)
      .sort((a, b) => a.voiceConfidence - b.voiceConfidence)[0];

    if (lowestVoice && lowestVoice.voiceConfidence < 0.58) {
      audio.push({
        kind: 'audio',
        time: lowestVoice.timestamp || 'Mid',
        label: 'Energy dialed down',
        evidence: `Voice confidence dipped to ${Math.round(lowestVoice.voiceConfidence * 100)}%.`,
        action: 'Listen back here and add a sharper last sentence that states the result, not just the process.',
        tone: 'orange',
      });
    }

    if (metrics.wpm > 0 && metrics.wpm < 115) {
      audio.push({
        kind: 'audio',
        time: 'All',
        label: 'Pace too careful',
        evidence: `${Math.round(metrics.wpm)} WPM can sound low-energy in an interview.`,
        action: 'Re-answer one question 10% faster while keeping one deliberate pause before the impact statement.',
        tone: 'orange',
      });
    }

    if (metrics.wpm > 165) {
      audio.push({
        kind: 'audio',
        time: 'All',
        label: 'Pace ran hot',
        evidence: `${Math.round(metrics.wpm)} WPM makes details harder to follow.`,
        action: 'Replay the longest answer and insert a half-second pause after context, action, and result.',
        tone: 'orange',
      });
    }

    if ((metrics.fillerWordCount ?? 0) >= 5) {
      audio.push({
        kind: 'audio',
        time: 'Review',
        label: 'Filler cluster',
        evidence: `${metrics.fillerWordCount} filler words were detected across the session.`,
        action: 'Redo the weakest answer with a silent pause instead of "um", "like", or "just".',
        tone: metrics.fillerWordCount >= 10 ? 'red' : 'orange',
      });
    }

    if (metrics.tonalVariety > 0 && metrics.tonalVariety < 52) {
      audio.push({
        kind: 'audio',
        time: 'All',
        label: 'Flat cadence',
        evidence: `Tonal variety landed at ${metrics.tonalVariety}/100.`,
        action: 'Put emphasis on the constraint, your decision, and the measurable outcome so the answer has shape.',
        tone: 'orange',
      });
    }

    if (audio.length === 0) {
      audio.push({
        kind: 'audio',
        time: 'Good',
        label: 'Delivery stayed controlled',
        evidence: metrics.wpm > 0 ? `${Math.round(metrics.wpm)} WPM with ${metrics.fillerWordCount ?? 0} fillers.` : 'No major delivery dips were detected.',
        action: 'Next step: add more vocal contrast around results and tradeoffs so strong answers sound decisive.',
        tone: 'green',
      });
    }
  }

  const worstSample = [...(postureData?.samples || [])]
    .sort((a, b) => {
      const aScore = (a.metrics.isGoodPosture ? 25 : 0) + a.metrics.shoulderAlignment;
      const bScore = (b.metrics.isGoodPosture ? 25 : 0) + b.metrics.shoulderAlignment;
      return aScore - bScore;
    })[0];

  if (postureData) {
    if (worstSample && !worstSample.metrics.isGoodPosture) {
      posture.push({
        kind: 'posture',
        time: formatSeconds(worstSample.elapsedSeconds),
        label: 'Posture broke during an answer',
        evidence: `Shoulder alignment dropped to ${Math.round(worstSample.metrics.shoulderAlignment)} with head ${worstSample.metrics.headPosition}.`,
        action: 'Rewatch this section and reset to shoulders level, chin neutral, camera at eye height.',
        tone: 'orange',
      });
    }

    if (postureData.timeInGoodPosture < 75) {
      posture.push({
        kind: 'posture',
        time: 'All',
        label: 'Presence was inconsistent',
        evidence: `${postureData.timeInGoodPosture}% of tracked time was in good posture.`,
        action: 'Before answering, plant both feet and keep your sternum aimed at the camera for the first 20 seconds.',
        tone: postureData.timeInGoodPosture < 55 ? 'red' : 'orange',
      });
    }

    if (postureData.headPosition !== 'centered') {
      posture.push({
        kind: 'posture',
        time: 'Review',
        label: 'Head position pulled attention',
        evidence: `Head position was classified as ${postureData.headPosition}.`,
        action: 'Raise or center the camera, then answer with eyes returning to the lens at the end of each point.',
        tone: 'orange',
      });
    }

    if (posture.length === 0) {
      posture.push({
        kind: 'posture',
        time: 'Good',
        label: 'Posture was stable',
        evidence: `${postureData.timeInGoodPosture}% good posture with ${postureData.shoulderAlignment}% shoulder alignment.`,
        action: 'Keep the same baseline and focus next on stronger eye-line returns after looking at notes.',
        tone: 'green',
      });
    }
  } else {
    posture.push({
      kind: 'posture',
      time: '--',
      label: 'No posture replay captured',
      evidence: signalFusion?.vision ? 'Vision summary exists, but frame-level posture samples were not attached.' : 'Camera tracking was not available for this session.',
      action: 'Run the next session with camera enabled so Kelv LENS can annotate posture moments.',
      tone: 'orange',
    });
  }

  return { audio: audio.slice(0, 4), posture: posture.slice(0, 3) };
}

function formatSeconds(seconds: number | undefined): string {
  if (seconds == null || Number.isNaN(seconds)) return 'Review';
  const mins = Math.floor(seconds / 60);
  const secs = Math.max(0, Math.round(seconds % 60));
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function getNearestPostureSample(postureData: PostureSnapshot | undefined, seconds: number) {
  const samples = postureData?.samples || [];
  if (!samples.length) return undefined;
  return samples.reduce((nearest, sample) => {
    const nearestDelta = Math.abs((nearest.elapsedSeconds ?? 0) - seconds);
    const sampleDelta = Math.abs((sample.elapsedSeconds ?? 0) - seconds);
    return sampleDelta < nearestDelta ? sample : nearest;
  }, samples[0]);
}

function getWorstPostureSample(postureData: PostureSnapshot | undefined) {
  const samples = postureData?.samples || [];
  if (!samples.length) return undefined;
  return [...samples].sort((a, b) => {
    const aGeometry = a.metrics.geometry;
    const bGeometry = b.metrics.geometry;
    const aScore =
      (a.metrics.isGoodPosture ? 25 : 0) +
      a.metrics.shoulderAlignment -
      Math.abs(aGeometry?.headOffsetPct ?? 0) * 0.25 -
      Math.abs(aGeometry?.torsoLeanDeg ?? 0);
    const bScore =
      (b.metrics.isGoodPosture ? 25 : 0) +
      b.metrics.shoulderAlignment -
      Math.abs(bGeometry?.headOffsetPct ?? 0) * 0.25 -
      Math.abs(bGeometry?.torsoLeanDeg ?? 0);
    return aScore - bScore;
  })[0];
}

function getGrade(score: number | null): { color: string; label: string } {
  if (score == null) return { color: 'var(--text-4)', label: '' };
  if (score >= 90) return { color: 'rgba(34,197,94,0.9)', label: 'Offer-ready' };
  if (score >= 80) return { color: 'rgba(59,130,246,0.9)', label: 'Strong signal' };
  if (score >= 70) return { color: 'rgba(234,179,8,0.9)', label: 'Getting there' };
  if (score >= 60) return { color: 'var(--orange)', label: 'Gap identified' };
  return { color: '#f87171', label: 'Needs work' };
}

export default InterviewResults;
