import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, MessageSquare, Mic, User, CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { QuestionMetrics, PerQuestionAnalysis } from '../../utils/perQuestionAnalytics';

interface PerQuestionBreakdownProps {
  analysis: PerQuestionAnalysis;
}

const PerQuestionBreakdown: React.FC<PerQuestionBreakdownProps> = ({ analysis }) => {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  if (!analysis || analysis.questions.length === 0) {
    return (
      <div className="bg-[#0f0f12] border border-white/5 rounded-2xl p-8 text-center">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Average Content"
          value={analysis.averageScores.content}
          color="text-purple-400"
        />
        <SummaryCard
          label="Average Delivery"
          value={analysis.averageScores.delivery}
          color="text-orange-400"
        />
        <SummaryCard
          label="Average Presence"
          value={analysis.averageScores.presence}
          color="text-green-400"
        />
        <SummaryCard
          label="Overall"
          value={analysis.averageScores.overall}
          color="text-blue-400"
        />
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
      <div className="bg-[#0f0f12] border border-white/5 rounded-2xl overflow-hidden">
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

const SummaryCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="bg-[#0f0f12] border border-white/5 rounded-xl p-4">
    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}/100</p>
  </div>
);

const HighlightCard: React.FC<{ type: 'strongest' | 'weakest'; question: QuestionMetrics }> = ({ type, question }) => (
  <div className={`bg-gradient-to-br ${type === 'strongest'
    ? 'from-green-500/10 to-emerald-500/5 border-green-500/20'
    : 'from-red-500/10 to-orange-500/5 border-red-500/20'
    } border rounded-xl p-4`}>
    <div className="flex items-start gap-3">
      {type === 'strongest' ? (
        <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
      ) : (
        <TrendingDown className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
      )}
      <div className="flex-1">
        <h4 className={`text-sm font-bold mb-1 ${type === 'strongest' ? 'text-green-400' : 'text-red-400'}`}>
          {type === 'strongest' ? 'Strongest Question' : 'Needs Work'}
        </h4>
        <p className="text-xs text-gray-400 mb-2">Q{question.questionNumber}: {question.questionText.substring(0, 80)}...</p>
        <div className="flex gap-2">
          <span className="text-xs px-2 py-1 bg-white/5 rounded">
            Score: {question.overallScore}/100
          </span>
          <span className="text-xs px-2 py-1 bg-white/5 rounded">
            {question.responseLength} words
          </span>
        </div>
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
    <div className="transition-colors hover:bg-white/[0.02]">
      {/* Collapsed Header */}
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold text-gray-500">Q{question.questionNumber}</span>
            <p className="text-sm text-gray-300 flex-1">{question.questionText}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold ${getScoreColor(question.overallScore)}`}>
              {question.overallScore}/100
            </span>
            <span className="text-xs text-gray-500">{question.responseLength} words</span>
            <span className="text-xs text-gray-500">{question.wpm} WPM</span>
            {question.fillerWordCount > 0 && (
              <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded">
                {question.fillerWordCount} fillers
              </span>
            )}
          </div>
        </div>
        <div className="ml-4">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-4">
              {/* Answer Text */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Your Answer</p>
                <p className="text-sm text-gray-300 leading-relaxed">{question.answerText}</p>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <ScorePill
                  icon={MessageSquare}
                  label="Content"
                  score={question.contentScore}
                  color="purple"
                />
                <ScorePill
                  icon={Mic}
                  label="Delivery"
                  score={question.deliveryScore}
                  color="orange"
                />
                <ScorePill
                  icon={User}
                  label="Presence"
                  score={question.presenceScore}
                  color="green"
                />
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricBox label="Voice Confidence" value={`${question.voiceConfidence}/100`} />
                <MetricBox label="Face Confidence" value={`${question.faceConfidence}/100`} />
                <MetricBox label="Tonal Variety" value={`${question.tonalVariety}/100`} />
                <MetricBox label="Expression" value={question.dominantExpression} />
              </div>

              {/* Content Analysis */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Content Quality</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">STAR Keywords</p>
                    <p className="text-lg font-bold text-white">{question.starKeywordCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Numbers Used</p>
                    <p className="text-lg font-bold text-white">{question.numberCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Weak Words</p>
                    <p className="text-lg font-bold text-yellow-400">{question.weakWordCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Filler Words</p>
                    <p className="text-lg font-bold text-red-400">{question.fillerWordCount}</p>
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Strengths</p>
                  {question.strengths.length > 0 ? (
                    <div className="space-y-2">
                      {question.strengths.map((item, i) => (
                        <div key={i} className="flex gap-2 items-start p-2 bg-green-500/5 border border-green-500/20 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-green-400">{item.area}</p>
                            <p className="text-xs text-gray-300">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">None detected</p>
                  )}
                </div>

                {/* Weaknesses */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Areas to Improve</p>
                  {question.weaknesses.length > 0 ? (
                    <div className="space-y-2">
                      {question.weaknesses.map((item, i) => (
                        <div key={i} className={`flex gap-2 items-start p-2 rounded-lg ${item.severity === 'critical'
                          ? 'bg-red-500/5 border border-red-500/20'
                          : 'bg-yellow-500/5 border border-yellow-500/20'
                          }`}>
                          <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${item.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'
                            }`} />
                          <div>
                            <p className={`text-xs font-bold ${item.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'
                              }`}>{item.area}</p>
                            <p className="text-xs text-gray-300">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">None detected</p>
                  )}
                </div>
              </div>

              {/* Ideal Answer Comparison Placeholder (Phase 1 Feature 2) */}
              {question.idealAnswerSimilarity !== undefined && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-xs text-blue-400 uppercase tracking-wider mb-2">Ideal Answer Comparison</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Similarity Score</p>
                      <p className="text-2xl font-bold text-blue-400">{question.idealAnswerSimilarity}/100</p>
                    </div>
                    {question.missingKeyPoints && question.missingKeyPoints.length > 0 && (
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 mb-1">Missing Key Points:</p>
                        <div className="flex flex-wrap gap-2">
                          {question.missingKeyPoints.map((point, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-white/5 rounded text-gray-300">
                              {point}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ScorePill: React.FC<{
  icon: React.FC<{ className?: string }>;
  label: string;
  score: number;
  color: 'purple' | 'orange' | 'green';
}> = ({ icon: Icon, label, score, color }) => {
  const colors = {
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20'
  };

  return (
    <div className={`${colors[color]} border rounded-xl p-3 flex items-center gap-3`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-lg font-bold ${colors[color].split(' ')[0]}`}>{score}</p>
      </div>
    </div>
  );
};

const MetricBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-white/5 border border-white/5 rounded-lg p-3">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-sm font-bold text-white truncate">{value}</p>
  </div>
);

export default PerQuestionBreakdown;
