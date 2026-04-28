import React, { useEffect, useMemo, useState } from 'react';
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
    postureData?: { shoulderAlignment: number; headPosition: 'centered' | 'forward' | 'tilted'; overallScore: number; timeInGoodPosture: number };
    jobContext?: { role?: string; industry?: string; experienceLevel?: string; jobDescription?: string };
    practicePlan?: any[];
    signalFusion?: any;
    signalReliability?: any;
    sessionResultV2?: any;
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
    for (let i = 0; i < transcript.length - 1; i++) {
      const cur = transcript[i], nxt = transcript[i + 1];
      if (cur.role === 'assistant' && nxt?.role === 'user')
        pairs.push({ question: cur.content, answer: nxt.content, questionNumber: pairs.length + 1 });
    }
    return pairs;
  }, [transcript]);

  const coachCtx = useMemo(() => ({ metrics, perQuestionAnalysis, practicePlan, signalFusion }), [metrics, perQuestionAnalysis, practicePlan, signalFusion]);

  // Load AI feedback as soon as we're on the report tab
  useEffect(() => {
    if (tab !== 'report' || loadingAI || aiFeedback || qaPairs.length === 0) return;
    const run = async () => {
      setLoadingAI(true); setAiError(null);
      try { setAiFeedback(await generateInterviewFeedback(qaPairs, jobContext, coachCtx)); }
      catch { setAiError('Coaching synthesis unavailable — showing signal-based analysis.'); }
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

              {/* Score hero */}
              <div style={{ borderBottom: '1px solid var(--border)', padding: '48px 40px 40px', background: 'var(--surface)' }}>
                <div style={{ maxWidth: '860px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '48px', alignItems: 'center' }}>

                  {/* Big score */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Overall</p>
                    <div style={{ position: 'relative' }}>
                      <span style={{ fontSize: '72px', fontWeight: 300, letterSpacing: '-0.04em', fontFamily: 'IBM Plex Mono, monospace', color: overallScore != null ? grade.color : 'var(--text-4)', lineHeight: 1 }}>
                        {fmt(overallScore)}
                      </span>
                      {overallScore != null && (
                        <span style={{ position: 'absolute', bottom: '8px', right: '-28px', fontSize: '14px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>/100</span>
                      )}
                    </div>
                    {grade.label && (
                      <span style={{ fontSize: '11px', color: grade.color, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.04em' }}>{grade.label}</span>
                    )}
                    {readiness && <ReadinessTag signal={readiness} />}
                  </div>

                  {/* Stats + score bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Score dimensions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        { label: 'Content', score: v2?.content ?? metrics.contentScore ?? null },
                        { label: 'Delivery', score: v2?.delivery ?? metrics.deliveryScore ?? null },
                        { label: 'Presence', score: v2?.presence ?? metrics.presenceScore ?? null },
                      ].map((d) => (
                        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ width: '56px', fontSize: '11px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', flexShrink: 0 }}>{d.label}</span>
                          <div style={{ flex: 1, height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                            {d.score != null && <div style={{ height: '100%', width: `${d.score}%`, background: sc(d.score), borderRadius: '2px', transition: 'width 0.8s ease' }} />}
                          </div>
                          <span style={{ width: '28px', fontSize: '12px', color: d.score != null ? 'var(--text)' : 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textAlign: 'right' }}>
                            {fmt(d.score)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Quick facts */}
                    <div style={{ display: 'flex', gap: '24px', paddingTop: '4px' }}>
                      {[
                        { label: 'Duration', value: durStr },
                        { label: 'Questions', value: `${qaPairs.length}` },
                        { label: 'Pace', value: metrics.wpm > 0 ? `${Math.round(metrics.wpm)} wpm` : '--' },
                        { label: 'Fillers', value: fmt(metrics.fillerWordCount) },
                      ].map((f) => (
                        <div key={f.label}>
                          <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{f.label}</p>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace' }}>{f.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px', display: 'flex', flexDirection: 'column', gap: '40px' }}>

                {/* ── Coaching summary ── */}
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
                <section>
                  <SectionLabel>Question by question</SectionLabel>
                  {perQuestionAnalysis && perQuestionAnalysis.questions.length > 0 ? (
                    <PerQuestionBreakdown analysis={perQuestionAnalysis} />
                  ) : qaPairs.length > 0 ? (
                    /* Fallback: show raw QA pairs with transcript highlighting */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                      {qaPairs.map((pair, i) => (
                        <RawQACard key={i} pair={pair} isLast={i === qaPairs.length - 1}
                          coaching={aiFeedback?.questionFeedback?.find(f => f.questionNumber === pair.questionNumber)} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                      <p style={{ fontSize: '14px', color: 'var(--text-4)' }}>Complete a full session to see question-by-question feedback.</p>
                    </div>
                  )}
                </section>

                {/* ── AI question coaching (if available) ── */}
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
const RawQACard = ({ pair, isLast, coaching }: { pair: any; isLast: boolean; coaching?: any }) => {
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
              {coaching && (
                <div style={{ padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                  <p style={{ fontSize: '10px', color: 'var(--orange)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Coaching note</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.55' }}>{coaching.overallAssessment}</p>
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
  const score: number | null = feedback.contentAnalysis?.score ?? null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', padding: '2px 7px', border: '1px solid var(--border)', borderRadius: '3px' }}>Q{feedback.questionNumber}</span>
          <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500 }}>{feedback.overallAssessment}</span>
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
                <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.55' }}>{feedback.suggestedAnswer}</p>
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(232,101,26,0.04)', border: '1px solid rgba(232,101,26,0.12)', borderRadius: '4px' }}>
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
function getGrade(score: number | null): { color: string; label: string } {
  if (score == null) return { color: 'var(--text-4)', label: '' };
  if (score >= 90) return { color: 'rgba(34,197,94,0.9)', label: 'Offer-ready' };
  if (score >= 80) return { color: 'rgba(59,130,246,0.9)', label: 'Strong signal' };
  if (score >= 70) return { color: 'rgba(234,179,8,0.9)', label: 'Getting there' };
  if (score >= 60) return { color: 'var(--orange)', label: 'Gap identified' };
  return { color: '#f87171', label: 'Needs work' };
}

export default InterviewResults;
