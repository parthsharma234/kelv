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
      <div className="bg-[#0f0f12] border border-white/5 rounded-lg p-8 text-center">
        <p className="text-gray-400">No question-level data available</p>
      </div>
    );
  }

  const toggleQuestion = (questionNumber: number) => {
    setExpandedQuestion(expandedQuestion === questionNumber ? null : questionNumber);
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Communication" value={analysis.averageScores.content} />
        <SummaryCard label="Delivery" value={analysis.averageScores.delivery} />
        <SummaryCard label="Presence" value={analysis.averageScores.presence} />
        <SummaryCard label="Overall" value={analysis.averageScores.overall} />
      </div>

      {/* Strongest/Weakest Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysis.strongestQuestion && (
          <HighlightCard
            type="strongest"
            question={analysis.strongestQuestion}
          />
        )}
        {analysis.weakestQuestion && (
          <HighlightCard
            type="weakest"
            question={analysis.weakestQuestion}
          />
        )}
      </div>

      {/* Per-Question List */}
      <div className="bg-[#0f0f12] border border-white/5 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            Question-by-Question Breakdown ({analysis.questions.length} Questions)
          </h3>
        </div>

        <div className="divide-y divide-white/5">
          {analysis.questions.map((question) => (
            <QuestionCard
              key={question.questionId}
              question={question}
              isExpanded={expandedQuestion === question.questionNumber}
              onToggle={() => toggleQuestion(question.questionNumber)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- SUBCOMPONENTS ---

const SummaryCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-6 transition-all hover:bg-white/[0.04]">
    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 font-medium">{label}</p>
    <p className="text-2xl font-light text-white/90 tracking-tight">{value}%</p>
  </div>
);

const HighlightCard: React.FC<{ type: 'strongest' | 'weakest'; question: QuestionMetrics }> = ({ type, question }) => (
  <div className={`bg-white/[0.02] border ${type === 'strongest' ? 'border-green-500/10' : 'border-red-500/10'} rounded-lg p-5 relative overflow-hidden`}>
    {/* Subtlest background tint */}
    <div className={`absolute inset-0 opacity-[0.03] ${type === 'strongest' ? 'bg-green-500' : 'bg-red-500'}`} />

    <div className="relative z-10">
      <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${type === 'strongest' ? 'text-green-400/80' : 'text-red-400/80'}`}>
        {type === 'strongest' ? 'Strongest answer' : 'Proof gap — revisit this'}
      </h4>
      <p className="text-sm text-gray-300 font-medium mb-3 line-clamp-2">"{question.questionText}"</p>
      <div className="flex items-center gap-4 text-[10px] text-gray-500 font-serif italic">
        <span>Score: {question.overallScore}%</span>
        <div className="w-1 h-1 rounded-full bg-gray-700" />
        <span>{question.responseLength} words</span>
      </div>
    </div>
  </div>
);

const QuestionCard: React.FC<{
  question: QuestionMetrics;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ question, isExpanded, onToggle }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="transition-all hover:bg-white/[0.01] border-b border-white/[0.04] last:border-0">
      {/* Collapsed Header */}
      <button
        onClick={onToggle}
        className="w-full p-8 flex items-center justify-between text-left group"
      >
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-[10px] font-medium text-gray-600 uppercase tracking-widest px-2 py-0.5 border border-white/5 rounded">Part {question.questionNumber}</span>
            <p className="text-sm text-white/90 font-medium flex-1">{question.questionText}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-light ${getScoreColor(question.overallScore)}`}>
                {question.overallScore}%
              </span>
              <span className="text-[10px] text-gray-600 font-serif italic">overall quality</span>
            </div>
            <div className="h-4 w-px bg-white/5" />
            <span className="text-xs text-gray-500 font-medium">{question.responseLength} words</span>
            <span className="text-xs text-gray-500 font-medium">{question.wpm} WPM</span>
          </div>
        </div>
        <div className={`transition-all duration-300 ${isExpanded ? 'rotate-180 opacity-40' : 'opacity-20 group-hover:opacity-60'}`}>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-8 pb-10 space-y-10">
              {/* Answer Text */}
              <div className="space-y-3">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-medium">Recorded Transcript</p>
                <div className="text-base text-gray-400 font-light leading-relaxed max-w-4xl italic">
                  <HighlightedText text={question.answerText} />
                </div>
              </div>

              {/* Score Breakdown - Simplified */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ScorePill label="Logic & Flow" score={question.contentScore} />
                <ScorePill label="Voice Clarity" score={question.deliveryScore} />
                <ScorePill label="Physical Presence" score={question.presenceScore} />
                <ScorePill label="Tonal Resonance" score={question.tonalVariety} />
              </div>

              {/* Personal Observations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/[0.04]">
                <div>
                  <h5 className="text-[10px] text-gray-600 uppercase tracking-widest font-medium mb-4">What worked well</h5>
                  <div className="space-y-4">
                    {question.strengths.length > 0 ? question.strengths.map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/20 mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-white/80 font-medium mb-1">{item.area}</p>
                          <p className="text-sm text-gray-500 leading-relaxed font-light">{item.description}</p>
                        </div>
                      </div>
                    )) : <p className="text-sm text-gray-600 italic font-light">Natural delivery without major highlights.</p>}
                  </div>
                </div>

                <div>
                  <h5 className="text-[10px] text-gray-600 uppercase tracking-widest font-medium mb-4">Gentle adjustments</h5>
                  <div className="space-y-4">
                    {question.weaknesses.length > 0 ? question.weaknesses.map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${item.severity === 'critical' ? 'bg-orange-500/20' : 'bg-yellow-500/10'}`} />
                        <div>
                          <p className="text-sm text-white/80 font-medium mb-1">{item.area}</p>
                          <p className="text-sm text-gray-500 leading-relaxed font-light">{item.description}</p>
                        </div>
                      </div>
                    )) : <p className="text-sm text-gray-600 italic font-light">Consistent and polished throughout.</p>}
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

const ScorePill: React.FC<{
  label: string;
  score: number;
}> = ({ label, score }) => (
  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5 font-medium">{label}</p>
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
      <p className="text-lg font-light text-white/80">{score}%</p>
    </div>
  </div>
);



const HighlightedText = ({ text }: { text: string }) => {
  const fillers = ['um', 'uh', 'like', 'actually', 'basically', 'really', 'just'];
  const weak = ['maybe', 'i think', 'sort of', 'kind of', 'might'];

  const words = text.split(/(\s+)/);

  return (
    <p className="leading-relaxed">
      {words.map((word, i) => {
        const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
        if (fillers.includes(cleanWord)) {
          return <span key={i} className="text-white decoration-red-500/40 underline underline-offset-4 decoration-1">{word}</span>;
        }
        if (weak.includes(cleanWord)) {
          return <span key={i} className="text-white decoration-yellow-500/40 underline underline-offset-4 decoration-1">{word}</span>;
        }
        return <span key={i}>{word}</span>;
      })}
    </p>
  );
};

export default PerQuestionBreakdown;
