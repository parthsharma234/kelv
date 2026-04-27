import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { QuestionMetrics, PerQuestionAnalysis } from '../../utils/perQuestionAnalytics';

interface PerQuestionBreakdownProps {
  analysis: PerQuestionAnalysis;
}

const PerQuestionBreakdown: React.FC<PerQuestionBreakdownProps> = ({ analysis }) => {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Summary bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
        <SummaryCard label="Communication" value={analysis.averageScores.content} />
        <SummaryCard label="Delivery" value={analysis.averageScores.delivery} />
        <SummaryCard label="Presence" value={analysis.averageScores.presence} />
        <SummaryCard label="Overall" value={analysis.averageScores.overall} />
      </div>

      {/* Strongest/Weakest */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {analysis.strongestQuestion && (
          <HighlightCard type="strongest" question={analysis.strongestQuestion} />
        )}
        {analysis.weakestQuestion && (
          <HighlightCard type="weakest" question={analysis.weakestQuestion} />
        )}
      </div>

      {/* Per-Question List */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Question-by-question breakdown ({analysis.questions.length} questions)
          </p>
        </div>
        <div>
          {analysis.questions.map((question, idx) => (
            <QuestionCard
              key={question.questionId}
              question={question}
              isExpanded={expandedQuestion === question.questionNumber}
              onToggle={() => toggleQuestion(question.questionNumber)}
              isLast={idx === analysis.questions.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div style={{ background: 'var(--surface)', padding: '18px 20px' }}>
    <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
      {label}
    </p>
    <p style={{ fontSize: '24px', fontWeight: 400, color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '-0.02em', lineHeight: 1 }}>
      {value}
    </p>
  </div>
);

const HighlightCard: React.FC<{ type: 'strongest' | 'weakest'; question: QuestionMetrics }> = ({ type, question }) => {
  const isStrong = type === 'strongest';
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${isStrong ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)'}`,
      borderRadius: '6px',
      padding: '20px',
    }}>
      <p style={{
        fontSize: '10px',
        fontWeight: 600,
        color: isStrong ? 'rgba(74,222,128,0.8)' : 'rgba(248,113,113,0.8)',
        fontFamily: 'IBM Plex Mono, monospace',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '10px',
      }}>
        {isStrong ? 'Strongest answer' : 'Proof gap — revisit this'}
      </p>
      <p style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500, marginBottom: '12px', lineHeight: '1.4' }}>
        "{question.questionText}"
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>
        <span>{question.overallScore}%</span>
        <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--border)' }} />
        <span>{question.responseLength} words</span>
      </div>
    </div>
  );
};

const QuestionCard: React.FC<{
  question: QuestionMetrics;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}> = ({ question, isExpanded, onToggle, isLast }) => {
  const scoreColor = question.overallScore >= 80 ? 'rgba(34,197,94,0.8)' : question.overallScore >= 60 ? 'var(--orange)' : '#ef4444';

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', padding: '2px 8px', border: '1px solid var(--border)', borderRadius: '3px' }}>
              Q{question.questionNumber}
            </span>
            <p style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{question.questionText}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '18px', fontWeight: 500, color: scoreColor, fontFamily: 'IBM Plex Mono, monospace' }}>
              {question.overallScore}%
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>
              {question.responseLength} words
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>
              {question.wpm} wpm
            </span>
          </div>
        </div>
        <ChevronDown style={{
          width: '14px', height: '14px', color: 'var(--text-4)',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          flexShrink: 0,
        }} />
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
            <div style={{ padding: '0 24px 24px', borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Transcript */}
              <div>
                <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Recorded transcript
                </p>
                <HighlightedText text={question.answerText} />
              </div>

              {/* Scores */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <ScorePill label="Logic & flow" score={question.contentScore} />
                <ScorePill label="Voice clarity" score={question.deliveryScore} />
                <ScorePill label="Presence" score={question.presenceScore} />
                <ScorePill label="Tonal variety" score={question.tonalVariety} />
              </div>

              {/* Observations */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <div>
                  <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                    What worked
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {question.strengths.length > 0 ? question.strengths.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(34,197,94,0.4)', marginTop: '5px', flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>{item.area}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-4)', lineHeight: '1.5' }}>{item.description}</p>
                        </div>
                      </div>
                    )) : (
                      <p style={{ fontSize: '12px', color: 'var(--text-4)' }}>Natural delivery without major highlights.</p>
                    )}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                    To improve
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {question.weaknesses.length > 0 ? question.weaknesses.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: item.severity === 'critical' ? 'rgba(232,101,26,0.5)' : 'rgba(234,179,8,0.4)', marginTop: '5px', flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>{item.area}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-4)', lineHeight: '1.5' }}>{item.description}</p>
                        </div>
                      </div>
                    )) : (
                      <p style={{ fontSize: '12px', color: 'var(--text-4)' }}>Consistent and polished throughout.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ScorePill: React.FC<{ label: string; score: number }> = ({ label, score }) => {
  const color = score >= 80 ? 'rgba(34,197,94,0.8)' : score >= 60 ? 'var(--orange)' : '#ef4444';
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '12px 14px' }}>
      <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace' }}>{score}%</p>
        <div style={{ flex: 1, height: '2px', background: 'var(--border)', borderRadius: '1px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: '1px' }} />
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
