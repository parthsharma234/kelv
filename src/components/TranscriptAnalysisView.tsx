import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb, 
  TrendingUp,
  Star,
  Target,
  Clock,
  User,
  Bot,
  ChevronDown,
  ChevronUp,
  Filter,
  BarChart3,
  PenLine
} from 'lucide-react';
import { TranscriptAnalysisResult, CommentAnnotation } from '../utils/transcriptAnalysis';

interface TranscriptAnalysisViewProps {
  analysisResult: TranscriptAnalysisResult;
  isLoading?: boolean;
}

const TranscriptAnalysisView: React.FC<TranscriptAnalysisViewProps> = ({
  analysisResult,
  isLoading = false
}) => {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [showOnlyUserResponses, setShowOnlyUserResponses] = useState(false);
  const [commentFilter, setCommentFilter] = useState<'all' | 'strength' | 'improvement' | 'suggestion'>('all');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const toggleComment = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  const getCommentIcon = (type: string) => {
    switch (type) {
      case 'strength': return CheckCircle;
      case 'improvement': return TrendingUp;
      case 'suggestion': return Lightbulb;
      case 'concern': return AlertTriangle;
      default: return MessageSquare;
    }
  };

  const getCommentColor = (type: string) => {
    switch (type) {
      case 'strength': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'improvement': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'suggestion': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'concern': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const filteredSegments = analysisResult.segments.filter(segment => {
    if (showOnlyUserResponses && segment.speaker !== 'user') return false;
    return true;
  });

  const formatTimestamp = (timestamp: number) => {
    const minutes = Math.floor(timestamp / 60000);
    const seconds = Math.floor((timestamp % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderTextWithAnnotations = (text: string, comments: CommentAnnotation[]) => {
    if (!comments || comments.length === 0) {
      return <span>{text}</span>;
    }

    // Sort comments by start index
    const sortedComments = [...comments].sort((a, b) => a.startIndex - b.startIndex);
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedComments.forEach((comment, index) => {
      // Add text before annotation
      if (comment.startIndex > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>
            {text.slice(lastIndex, comment.startIndex)}
          </span>
        );
      }

      // Add annotated text
      const annotatedText = text.slice(comment.startIndex, comment.endIndex);
      elements.push(
        <span
          key={`annotation-${comment.id}`}
          className={`relative cursor-pointer rounded px-1 ${getCommentColor(comment.type)} hover:opacity-80 transition-opacity`}
          onClick={() => toggleComment(comment.id)}
          title={comment.comment}
        >
          {annotatedText}
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-current opacity-60 text-xs flex items-center justify-center">
            {index + 1}
          </span>
        </span>
      );

      lastIndex = comment.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end">
          {text.slice(lastIndex)}
        </span>
      );
    }

    return <>{elements}</>;
  };

  if (isLoading) {
    return (
      <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-400"></div>
          <h3 className="text-xl font-semibold text-white">Analyzing Transcript...</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-dark-600 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-dark-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Analysis Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-orange-400" />
          Transcript Analysis Overview
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {Object.entries(analysisResult.overallAnalysis.averageScores).map(([key, score]) => (
            <div key={key} className="bg-dark-700/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">{score}/10</div>
              <div className="text-sm text-gray-400 capitalize">{key}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-green-400" />
              Key Strengths
            </h4>
            <ul className="space-y-2">
              {analysisResult.overallAnalysis.keyStrengths.map((strength, index) => (
                <li key={index} className="text-green-400 text-sm flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {strength}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-400" />
              Areas for Improvement
            </h4>
            <ul className="space-y-2">
              {analysisResult.overallAnalysis.primaryImprovements.map((improvement, index) => (
                <li key={index} className="text-yellow-400 text-sm flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-dark-700/20 rounded-lg">
          <p className="text-gray-300 text-sm leading-relaxed">
            {analysisResult.overallAnalysis.overallFeedback}
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <button
          onClick={() => setShowOnlyUserResponses(!showOnlyUserResponses)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            showOnlyUserResponses 
              ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' 
              : 'bg-dark-700/30 border-dark-600/30 text-gray-400 hover:text-white'
          }`}
        >
          <Filter className="w-4 h-4" />
          Show Only Responses
        </button>

        <select
          value={commentFilter}
          onChange={(e) => setCommentFilter(e.target.value as any)}
          className="px-4 py-2 bg-dark-700/30 border border-dark-600/30 rounded-lg text-white text-sm"
        >
          <option value="all">All Comments</option>
          <option value="strength">Strengths</option>
          <option value="improvement">Improvements</option>
          <option value="suggestion">Suggestions</option>
        </select>
      </div>

      {/* Transcript with Annotations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-dark-800/50 rounded-2xl border border-dark-700 overflow-hidden"
      >
        <div className="p-6 border-b border-dark-700">
          <h3 className="text-xl font-semibold text-white flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-orange-400" />
            Annotated Transcript
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            Click on highlighted text to view detailed feedback
          </p>
        </div>

        <div className="max-h-[800px] overflow-y-auto">
          {filteredSegments.map((segment, index) => (
            <motion.div
              key={segment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-6 border-b border-dark-700/50 hover:bg-dark-700/20 transition-colors ${
                selectedSegment === segment.id ? 'bg-dark-700/30' : ''
              }`}
              onClick={() => setSelectedSegment(selectedSegment === segment.id ? null : segment.id)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    segment.speaker === 'user' 
                      ? 'bg-orange-500/20 text-orange-400' 
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {segment.speaker === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`font-medium ${
                      segment.speaker === 'user' ? 'text-orange-400' : 'text-blue-400'
                    }`}>
                      {segment.speaker === 'user' ? 'Candidate' : 'Interviewer'}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(segment.timestamp)}
                    </span>
                    {segment.analysis && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        segment.analysis.scores.overall >= 8 ? 'bg-green-500/20 text-green-400' :
                        segment.analysis.scores.overall >= 6 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {segment.analysis.scores.overall}/10
                      </span>
                    )}
                  </div>

                  <div className="text-gray-300 leading-relaxed mb-3">
                    {segment.analysis?.specificComments 
                      ? renderTextWithAnnotations(segment.text, segment.analysis.specificComments)
                      : segment.text
                    }
                  </div>

                  {/* Analysis Details */}
                  <AnimatePresence>
                    {selectedSegment === segment.id && segment.analysis && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {segment.analysis.strengths.length > 0 && (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                              <h5 className="text-green-400 font-medium mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Strengths
                              </h5>
                              <ul className="space-y-1">
                                {segment.analysis.strengths.map((strength, i) => (
                                  <li key={i} className="text-green-300 text-sm">• {strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {segment.analysis.improvements.length > 0 && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                              <h5 className="text-yellow-400 font-medium mb-2 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Improvements
                              </h5>
                              <ul className="space-y-1">
                                {segment.analysis.improvements.map((improvement, i) => (
                                  <li key={i} className="text-yellow-300 text-sm">• {improvement}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {segment.analysis.actionableAdvice.length > 0 && (
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                            <h5 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4" />
                              Actionable Advice
                            </h5>
                            <ul className="space-y-1">
                              {segment.analysis.actionableAdvice.map((advice, i) => (
                                <li key={i} className="text-blue-300 text-sm">• {advice}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {segment.analysis.rewriteSuggestions && (
                          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                            <h5 className="text-purple-400 font-medium mb-2 flex items-center gap-2">
                              <PenLine className="w-4 h-4" />
                              Suggested Rewrite
                            </h5>
                            <p className="text-purple-300 text-sm mb-2">
                              {segment.analysis.rewriteSuggestions.restructure}
                            </p>
                            <p className="text-purple-300 text-sm">
                              {segment.analysis.rewriteSuggestions.concise}
                            </p>
                          </div>
                        )}

                        {/* Detailed Comments */}
                        {segment.analysis.specificComments.length > 0 && (
                          <div className="space-y-3">
                            <h5 className="text-white font-medium">Detailed Comments</h5>
                            {segment.analysis.specificComments.map((comment) => (
                              <div
                                key={comment.id}
                                className={`p-3 rounded-lg border ${getCommentColor(comment.type)}`}
                              >
                                <div className="flex items-start gap-3">
                                  {React.createElement(getCommentIcon(comment.type), {
                                    className: "w-4 h-4 mt-0.5 flex-shrink-0"
                                  })}
                                  <div className="flex-1">
                                    <div className="font-medium text-sm mb-1">
                                      "{comment.text}"
                                    </div>
                                    <div className="text-sm opacity-90">
                                      {comment.comment}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {segment.analysis && (
                  <div className="flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSegment(selectedSegment === segment.id ? null : segment.id);
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {selectedSegment === segment.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default TranscriptAnalysisView;
