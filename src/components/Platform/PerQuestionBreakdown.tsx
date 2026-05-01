import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, Loader2 } from 'lucide-react';
import { QuestionMetrics, PerQuestionAnalysis } from '../../utils/perQuestionAnalytics';
import { CoachingItem, QuestionFeedback } from '../../utils/openAIFeedback';

interface PerQuestionBreakdownProps {
  analysis: PerQuestionAnalysis;
  questionFeedback?: QuestionFeedback[];
  loadingFeedback?: boolean;
  feedbackError?: string | null;
}

const PerQuestionBreakdown: React.FC<PerQuestionBreakdownProps> = ({
  analysis,
  questionFeedback = [],
  loadingFeedback = false,
  feedbackError = null,
}) => {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const feedbackByQuestion = new Map(questionFeedback.map((item) => [item.questionNumber, item]));

  if (!analysis || analysis.questions.length === 0) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>No question-level data available</p>
      </div>
    );
  }

  const toggleQuestion = (questionNumber: number) => {
    setExpandedQuestion(expandedQuestion === questionNumber ? null : questionNumber);
  };

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
            Question-by-question ({analysis.questions.length})
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-4)', lineHeight: '1.45' }}>
            Coaching is generated from the exact question, answer, role context, and Kelv LENS signals.
          </p>
        </div>
        {loadingFeedback && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--text-4)', fontSize: '11px', fontFamily: 'IBM Plex Mono, monospace', flexShrink: 0 }}>
            <Loader2 style={{ width: '12px', height: '12px', animation: 'spin 0.8s linear infinite' }} />
            reading session
          </div>
        )}
      </div>

      {feedbackError && (
        <div style={{ margin: '14px 16px 0', padding: '10px 12px', background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.16)', borderRadius: '6px', display: 'flex', gap: '9px', alignItems: 'flex-start' }}>
          <AlertTriangle style={{ width: '13px', height: '13px', color: 'rgba(253,224,71,0.8)', flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontSize: '12px', color: 'rgba(253,224,71,0.78)', lineHeight: '1.45' }}>{feedbackError}</p>
        </div>
      )}

      <div>
        {analysis.questions.map((question, idx) => (
          <QuestionCard
            key={question.questionId}
            question={question}
            feedback={feedbackByQuestion.get(question.questionNumber)}
            loadingFeedback={loadingFeedback}
            feedbackError={feedbackError}
            isExpanded={expandedQuestion === question.questionNumber}
            onToggle={() => toggleQuestion(question.questionNumber)}
            isLast={idx === analysis.questions.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

const QuestionCard: React.FC<{
  question: QuestionMetrics;
  feedback?: QuestionFeedback;
  loadingFeedback: boolean;
  feedbackError: string | null;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}> = ({ question, feedback, loadingFeedback, feedbackError, isExpanded, onToggle, isLast }) => {
  const score = feedback?.scores?.overall ?? question.overallScore;
  const scoreColor = score >= 80 ? 'rgba(34,197,94,0.8)' : score >= 60 ? 'var(--orange)' : '#ef4444';
  const diagnosis = feedback?.shortDiagnosis || (loadingFeedback ? 'Kelv is reading this answer.' : feedbackError ? 'OpenAI coaching is unavailable for this answer.' : 'OpenAI coaching has not returned for this answer yet.');

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', padding: '2px 8px', border: '1px solid var(--border)', borderRadius: '3px', flexShrink: 0 }}>
              Q{question.questionNumber}
            </span>
            <p style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500, lineHeight: '1.45' }}>{question.questionText}</p>
          </div>
          <p style={{ fontSize: '12px', color: feedback ? 'var(--text-3)' : 'var(--text-4)', lineHeight: '1.5' }}>{diagnosis}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '18px', fontWeight: 500, color: scoreColor, fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>{Math.round(score)}%</p>
            <p style={{ fontSize: '10px', color: 'var(--text-4)', marginTop: '3px', fontFamily: 'IBM Plex Mono, monospace' }}>{question.responseLength} words</p>
          </div>
          <ChevronDown style={{
            width: '14px', height: '14px', color: 'var(--text-4)',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }} />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 20px 22px', borderTop: '1px solid var(--border)', paddingTop: '18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Your answer
                </p>
                <HighlightedText text={question.answerText} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <ScorePill label="Content" score={feedback?.scores?.content ?? question.contentScore} />
                <ScorePill label="Delivery" score={feedback?.scores?.delivery ?? question.deliveryScore} />
                <ScorePill label="Presence" score={feedback?.scores?.presence ?? question.presenceScore} />
                <ScorePill label="Pace" score={question.wpm} suffix="wpm" raw />
              </div>

              <QuestionVoiceTrace question={question} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <CoachingColumn
                  title="What worked"
                  tone="green"
                  items={feedback?.whatWorked || []}
                  loading={loadingFeedback && !feedback}
                  unavailable={Boolean(feedbackError && !feedback)}
                  emptyText="OpenAI did not return a specific strength for this answer."
                />
                <CoachingColumn
                  title="To improve"
                  tone="orange"
                  items={feedback?.toImprove || []}
                  loading={loadingFeedback && !feedback}
                  unavailable={Boolean(feedbackError && !feedback)}
                  emptyText="OpenAI did not return a specific improvement for this answer."
                />
              </div>

              {(feedback?.suggestedAnswerSkeleton || feedback?.nextRep) && (
                <div style={{ padding: '13px 14px', background: 'rgba(232,101,26,0.05)', border: '1px solid rgba(232,101,26,0.14)', borderRadius: '6px' }}>
                  <p style={{ fontSize: '10px', color: 'var(--orange)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                    Next rep
                  </p>
                  {feedback.nextRep && <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.55', marginBottom: feedback.suggestedAnswerSkeleton ? '8px' : 0 }}>{feedback.nextRep}</p>}
                  {feedback.suggestedAnswerSkeleton && <p style={{ fontSize: '12px', color: 'var(--text-4)', lineHeight: '1.6' }}>{feedback.suggestedAnswerSkeleton}</p>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const QuestionVoiceTrace = ({ question }: { question: QuestionMetrics }) => {
  const bars = buildVoiceBars(question);
  const deliveryScore = Math.round(question.deliveryScore);
  const avgPause = getAnswerWindowSeconds(question);
  const energy = question.tonalVariety >= 68 ? 'varied' : question.tonalVariety >= 48 ? 'steady' : 'flat';

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '7px', background: '#080909', padding: '14px 14px 13px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', marginBottom: '12px', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Voice trace</p>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: '1.45' }}>Q{question.questionNumber} delivery pattern</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '20px', color: deliveryScore >= 70 ? 'rgba(34,197,94,0.9)' : 'var(--orange)', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>{deliveryScore}</p>
          <p style={{ fontSize: '10px', color: 'var(--text-4)', marginTop: '3px' }}>delivery</p>
        </div>
      </div>

      <div style={{ height: '50px', display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '13px' }}>
        {bars.map((bar, index) => (
          <div
            key={index}
            title={bar.flag ? bar.flag : `${Math.round(bar.height)}% signal`}
            style={{
              flex: 1,
              height: `${bar.height}%`,
              alignSelf: 'center',
              borderRadius: '2px',
              background: bar.flag ? 'var(--orange)' : 'rgba(255,255,255,0.16)',
              boxShadow: bar.flag ? '0 0 13px rgba(232,101,26,0.25)' : 'none'
            }}
          />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        <TraceMetric label="Pace" value={`${question.wpm} wpm`} hot={question.wpm < 110 || question.wpm > 160} />
        <TraceMetric label="Fillers" value={`${question.fillerWordCount}`} hot={question.fillerWordCount > 0} />
        <TraceMetric label="Window" value={`${avgPause}s`} hot={avgPause > 8} />
        <TraceMetric label="Energy" value={energy} hot={energy === 'flat'} />
      </div>
    </div>
  );
};

const TraceMetric = ({ label, value, hot }: { label: string; value: string; hot?: boolean }) => (
  <div style={{ border: '1px solid var(--border)', borderRadius: '5px', padding: '8px 9px', background: 'rgba(255,255,255,0.02)' }}>
    <p style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{label}</p>
    <p style={{ fontSize: '12px', color: hot ? 'var(--orange)' : 'var(--text)', fontFamily: 'IBM Plex Mono, monospace' }}>{value}</p>
  </div>
);

const CoachingColumn = ({
  title,
  tone,
  items,
  loading,
  unavailable,
  emptyText,
}: {
  title: string;
  tone: 'green' | 'orange';
  items: CoachingItem[];
  loading: boolean;
  unavailable: boolean;
  emptyText: string;
}) => {
  const dot = tone === 'green' ? 'rgba(34,197,94,0.55)' : 'rgba(232,101,26,0.65)';
  const titleColor = tone === 'green' ? 'rgba(74,222,128,0.78)' : 'var(--orange)';

  return (
    <div>
      <p style={{ fontSize: '10px', color: titleColor, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading && <p style={{ fontSize: '12px', color: 'var(--text-4)', lineHeight: '1.5' }}>Reading this answer with role context...</p>}
        {unavailable && <p style={{ fontSize: '12px', color: 'var(--text-4)', lineHeight: '1.5' }}>OpenAI coaching unavailable. No generic substitute is shown.</p>}
        {!loading && !unavailable && items.length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-4)', lineHeight: '1.5' }}>{emptyText}</p>}
        {items.map((item, i) => (
          <div key={`${item.area}-${i}`} style={{ display: 'flex', gap: '10px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: dot, marginTop: '5px', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>{item.area}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-4)', lineHeight: '1.5' }}>{item.note}</p>
              {item.evidence && <p style={{ fontSize: '11px', color: 'var(--text-4)', lineHeight: '1.45', marginTop: '4px', fontStyle: 'italic' }}>Evidence: {item.evidence}</p>}
              {item.nextRep && <p style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: '1.45', marginTop: '4px' }}>Next: {item.nextRep}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ScorePill: React.FC<{ label: string; score: number; suffix?: string; raw?: boolean }> = ({ label, score, suffix = '%', raw = false }) => {
  const color = raw
    ? (score >= 110 && score <= 160 ? 'rgba(34,197,94,0.8)' : 'var(--orange)')
    : (score >= 80 ? 'rgba(34,197,94,0.8)' : score >= 60 ? 'var(--orange)' : '#ef4444');
  const barWidth = raw ? Math.max(8, Math.min(100, (score / 180) * 100)) : Math.max(0, Math.min(100, score));
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '11px 12px' }}>
      <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace', whiteSpace: 'nowrap' }}>{Math.round(score)}{suffix}</p>
        <div style={{ flex: 1, height: '2px', background: 'var(--border)', borderRadius: '1px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${barWidth}%`, background: color, borderRadius: '1px' }} />
        </div>
      </div>
    </div>
  );
};

const HighlightedText = ({ text }: { text: string }) => {
  const fillers = ['um', 'uh', 'like', 'actually', 'basically', 'really', 'just'];
  const weak = ['maybe', 'i think', 'sort of', 'kind of', 'might'];
  const words = text.split(/(\s+)/);
  return (
    <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.65' }}>
      {words.map((word, i) => {
        const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
        if (fillers.includes(cleanWord)) {
          return <span key={i} style={{ color: 'var(--text)', textDecoration: 'underline', textDecorationColor: 'rgba(239,68,68,0.4)', textUnderlineOffset: '3px' }}>{word}</span>;
        }
        if (weak.includes(cleanWord)) {
          return <span key={i} style={{ color: 'var(--text)', textDecoration: 'underline', textDecorationColor: 'rgba(234,179,8,0.4)', textUnderlineOffset: '3px', fontStyle: 'italic' }}>{word}</span>;
        }
        return <span key={i}>{word}</span>;
      })}
    </p>
  );
};

export default PerQuestionBreakdown;

function buildVoiceBars(question: QuestionMetrics): Array<{ height: number; flag: string | null }> {
  const seed = `${question.questionText} ${question.answerText}`.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const count = Math.max(18, Math.min(42, Math.round(question.responseLength * 0.7) || 18));
  const pacePenalty = question.wpm < 110 || question.wpm > 160;
  const fillerSlots = new Set<number>();
  const hesitationSlots = new Set<number>();

  for (let i = 0; i < Math.min(question.fillerWordCount, 6); i += 1) {
    fillerSlots.add(Math.min(count - 1, Math.floor(((i + 1) / (question.fillerWordCount + 1)) * count)));
  }

  if (question.anxietyLevel > 38 || pacePenalty) {
    hesitationSlots.add(Math.floor(count * 0.48));
    if (question.anxietyLevel > 58) hesitationSlots.add(Math.floor(count * 0.62));
  }

  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin((index + seed % 9) * 0.72) * 16 + Math.cos((index + seed % 5) * 0.31) * 10;
    const confidence = Math.max(0.2, Math.min(0.95, question.voiceConfidence / 100));
    const variety = Math.max(0.22, Math.min(0.9, question.tonalVariety / 100));
    const height = Math.max(20, Math.min(90, 34 + wave * variety + confidence * 34));
    const flag = fillerSlots.has(index)
      ? 'filler detected'
      : hesitationSlots.has(index)
        ? 'hesitation spike'
        : null;
    return { height, flag };
  });
}

function getAnswerWindowSeconds(question: QuestionMetrics): number {
  const seconds = (question.answerTimestamp.getTime() - question.questionTimestamp.getTime()) / 1000;
  return Math.round(Math.max(1, seconds) * 10) / 10;
}
