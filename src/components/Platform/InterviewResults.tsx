import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  BarChart3,
  TrendingUp,
  Target,
  MessageSquare,
  Award,
  Mic,
  Video,
  FileText,
  MessageCircle,
  Heart
} from 'lucide-react';

interface InterviewResultsProps {
  sessionData: any;
  onBackToDashboard: () => void;
  onStartNewInterview: () => void;
}

const InterviewResults: React.FC<InterviewResultsProps> = ({
  sessionData,
  onBackToDashboard,
  onStartNewInterview
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'voice' | 'vision' | 'expression'>('overview');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Extract data with safe fallbacks
  const score = sessionData?.overallScore || 0;
  const duration = sessionData?.duration || 0;
  const questionsAnswered = sessionData?.questionsAnswered || sessionData?.questionCount || 0;
  const responses = sessionData?.responses || [];
  const questions = sessionData?.questions || [];
  const transcript = sessionData?.transcript || [];
  const expressionInsights = sessionData?.expressionInsights;

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Get performance level
  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { label: 'Exceptional', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' };
    if (score >= 75) return { label: 'Strong', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
    if (score >= 60) return { label: 'Good', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
    return { label: 'Needs Work', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
  };

  const performance = getPerformanceLevel(score);

  // Process transcript into segments with questions
  const transcriptSegments = React.useMemo(() => {
    const segments: any[] = [];
    let currentSegment: any = null;

    transcript.forEach((chunk: any) => {
      // Check if this is a new question
      const isNewQuestion = chunk.speaker === 'assistant' && chunk.text.endsWith('?');

      if (isNewQuestion) {
        if (currentSegment) {
          segments.push(currentSegment);
        }
        currentSegment = {
          question: chunk.text,
          conversation: [chunk]
        };
      } else if (currentSegment) {
        currentSegment.conversation.push(chunk);
      }
    });

    if (currentSegment) {
      segments.push(currentSegment);
    }

    return segments;
  }, [transcript]);

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className="border-b border-dark-700/50 bg-dark-800/30 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold text-white">Interview Results</div>

            <button
              onClick={onStartNewInterview}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-all"
            >
              New Interview
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* Hero Score Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-7 h-7 text-green-400" />
            <span className="text-lg font-semibold text-green-400">Interview Complete</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Score Card */}
            <div className="lg:col-span-2 bg-dark-800/60 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-8">
              <div className="flex items-end gap-6">
                <div>
                  <div className="text-sm text-gray-500 mb-2">Overall Score</div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-7xl font-bold text-white">{score}</span>
                    <span className="text-4xl text-gray-600 font-semibold">/100</span>
                  </div>
                  <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 ${performance.bg} border ${performance.border} rounded-full`}>
                    <Award className={`w-4 h-4 ${performance.color}`} />
                    <span className={`font-semibold ${performance.color}`}>{performance.label} Performance</span>
                  </div>
                </div>

                {/* Visual Score Ring */}
                <div className="flex-1 flex justify-center items-center">
                  <div className="relative w-48 h-48">
                    <svg className="transform -rotate-90 w-48 h-48">
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-dark-700"
                      />
                      <motion.circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 88}`}
                        strokeDashoffset={`${2 * Math.PI * 88 * (1 - score / 100)}`}
                        className="text-orange-500"
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - score / 100) }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <TrendingUp className="w-12 h-12 text-orange-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="space-y-4">
              <div className="bg-dark-800/60 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-sm text-gray-500">Duration</span>
                </div>
                <div className="text-3xl font-bold text-white">{formatDuration(duration)}</div>
              </div>

              <div className="bg-dark-800/60 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-sm text-gray-500">Questions</span>
                </div>
                <div className="text-3xl font-bold text-white">{questionsAnswered}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-8 border-b border-dark-700/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === 'overview'
                ? 'text-orange-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </div>
            {activeTab === 'overview' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === 'transcript'
                ? 'text-orange-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Transcript Analysis
            </div>
            {activeTab === 'transcript' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === 'voice'
                ? 'text-orange-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Voice Analysis
            </div>
            {activeTab === 'voice' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('vision')}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === 'vision'
                ? 'text-orange-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Vision Analysis
            </div>
            {activeTab === 'vision' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
              />
            )}
          </button>
          {expressionInsights && (
            <button
              onClick={() => setActiveTab('expression')}
              className={`px-6 py-3 font-semibold transition-all relative ${
                activeTab === 'expression'
                  ? 'text-orange-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Expression Analysis
              </div>
              {activeTab === 'expression' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                />
              )}
            </button>
          )}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-1 gap-6">
                {/* Question Performance */}
                <div className="bg-dark-800/60 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Target className="w-6 h-6 text-blue-400" />
                    <h3 className="text-xl font-bold text-white">Question Performance</h3>
                  </div>
                  <div className="space-y-6">
                    {responses.map((response: any, idx: number) => {
                      const responseScore = (response.analysis?.score || 0) * 10;
                      const question = questions[idx];
                      return (
                        <div key={idx}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="text-sm text-gray-400 mb-1">Question {idx + 1}</div>
                              <div className="text-white font-medium">{question?.text || response.question || 'Question'}</div>
                            </div>
                            <div className="ml-4 text-right">
                              <div className="text-2xl font-bold text-white">{Math.round(responseScore)}</div>
                              <div className="text-xs text-gray-500">/ 100</div>
                            </div>
                          </div>
                          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${responseScore}%` }}
                              transition={{ duration: 1, delay: idx * 0.1 }}
                              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                            />
                          </div>
                          {response.analysis?.feedback && (
                            <div className="mt-3 text-sm text-gray-400 bg-dark-700/30 rounded-lg p-3">
                              {response.analysis.feedback}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'transcript' && (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-dark-800/60 backdrop-blur-xl border border-dark-700/50 rounded-2xl"
            >
              {/* Document-style header */}
              <div className="border-b border-dark-700/50 px-8 py-4">
                <h3 className="text-xl font-semibold text-white">Interview Transcript</h3>
                <div className="text-sm text-gray-500 mt-1">
                  {formatDuration(duration)} • {questionsAnswered} questions
                </div>
              </div>

              {/* Document-style content */}
              <div className="px-16 py-8 max-h-[800px] overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                  {transcriptSegments.map((segment: any, segIdx: number) => {
                    const response = responses[segIdx];
                    const responseScore = response ? (response.analysis?.score || 0) * 10 : 0;

                    return (
                      <div key={segIdx} className="mb-12 relative group">
                        {/* Question as heading */}
                        <h4 className="text-lg font-semibold text-white mb-4 pr-24">
                          Q{segIdx + 1}: {segment.question}
                        </h4>

                        {/* Score badge on the right */}
                        <div className="absolute top-0 right-0 flex items-center gap-2">
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            responseScore >= 80 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            responseScore >= 60 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            responseScore >= 40 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {Math.round(responseScore)}%
                          </div>
                        </div>

                        {/* Conversation */}
                        <div className="space-y-3">
                          {segment.conversation.slice(1).map((chunk: any, chunkIdx: number) => (
                            <div key={chunkIdx} className={`${chunk.speaker === 'user' ? 'pl-8' : ''}`}>
                              <div className={`text-gray-300 leading-relaxed ${
                                chunk.speaker === 'user' ? 'font-medium' : ''
                              }`}>
                                <span className={`text-xs font-semibold uppercase tracking-wide mr-2 ${
                                  chunk.speaker === 'user' ? 'text-blue-400' : 'text-gray-500'
                                }`}>
                                  {chunk.speaker === 'user' ? 'You' : 'AI'}:
                                </span>
                                {chunk.text}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* AI Comment (like Google Docs comment) */}
                        {response?.analysis?.feedback && (
                          <div className="mt-4 ml-8 border-l-4 border-orange-500 pl-4 py-2 bg-orange-500/10 rounded-r">
                            <div className="flex items-start gap-2">
                              <MessageCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-xs font-semibold text-orange-400 mb-1">AI Feedback</div>
                                <div className="text-sm text-gray-300">{response.analysis.feedback}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'voice' && (
            <motion.div
              key="voice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-dark-800/60 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-12 text-center"
            >
              <Mic className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">Voice Analysis Coming Soon</h3>
              <p className="text-gray-400 max-w-2xl mx-auto">
                We're working on advanced voice analytics including tone, pace, filler words, and confidence detection.
              </p>
            </motion.div>
          )}

          {activeTab === 'vision' && (
            <motion.div
              key="vision"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-dark-800/60 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-12 text-center"
            >
              <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">Vision Analysis Coming Soon</h3>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Computer vision analysis will provide insights on body language, eye contact, posture, and facial expressions.
              </p>
            </motion.div>
          )}

          {activeTab === 'expression' && expressionInsights && (
            <motion.div
              key="expression"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-1 gap-6">
                {/* Emotional Profile */}
                <div className="bg-dark-800/60 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Heart className="w-6 h-6 text-pink-400" />
                    <h3 className="text-xl font-bold text-white">Emotional Profile</h3>
                  </div>

                  {/* Dominant Emotions */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Top Emotions</h4>
                    <div className="space-y-3">
                      {expressionInsights.overallEmotionalProfile.dominantEmotions.map((emotion: any, index: number) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-white">{emotion.name}</span>
                              <span className="text-sm text-gray-400">{(emotion.score * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  index === 0 ? 'bg-pink-500' :
                                  index === 1 ? 'bg-purple-500' :
                                  index === 2 ? 'bg-blue-500' :
                                  'bg-gray-500'
                                }`}
                                style={{ width: `${emotion.score * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Emotional Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700/30">
                      <div className="text-sm text-gray-400 mb-1">Emotional Stability</div>
                      <div className="text-2xl font-bold text-white">
                        {(expressionInsights.overallEmotionalProfile.emotionalStability * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700/30">
                      <div className="text-sm text-gray-400 mb-1">Positive Emotion Ratio</div>
                      <div className="text-2xl font-bold text-white">
                        {(expressionInsights.overallEmotionalProfile.positiveEmotionRatio * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Communication Style */}
                <div className="bg-dark-800/60 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <MessageSquare className="w-6 h-6 text-blue-400" />
                    <h3 className="text-xl font-bold text-white">Communication Style</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Confidence</span>
                        <span className="text-sm text-gray-400">{(expressionInsights.communicationStyle.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${expressionInsights.communicationStyle.confidence * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Enthusiasm</span>
                        <span className="text-sm text-gray-400">{(expressionInsights.communicationStyle.enthusiasm * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 rounded-full"
                          style={{ width: `${expressionInsights.communicationStyle.enthusiasm * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Authenticity</span>
                        <span className="text-sm text-gray-400">{(expressionInsights.communicationStyle.authenticity * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${expressionInsights.communicationStyle.authenticity * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Stress Level</span>
                        <span className="text-sm text-gray-400">{(expressionInsights.communicationStyle.stress * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${expressionInsights.communicationStyle.stress * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Analysis */}
                <div className="bg-dark-800/60 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                    <h3 className="text-xl font-bold text-white">Emotional Trajectory</h3>
                  </div>

                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-900/50 rounded-lg border border-dark-700/30">
                      <span className="text-sm text-gray-400">Overall Trajectory:</span>
                      <span className={`text-sm font-semibold ${
                        expressionInsights.timelineAnalysis.emotionalTrajectory === 'improving' ? 'text-green-400' :
                        expressionInsights.timelineAnalysis.emotionalTrajectory === 'declining' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {expressionInsights.timelineAnalysis.emotionalTrajectory.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {expressionInsights.timelineAnalysis.peakMoments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Peak Moments</h4>
                      <div className="space-y-2">
                        {expressionInsights.timelineAnalysis.peakMoments.map((moment: any, index: number) => (
                          <div key={index} className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-gray-300">{moment.emotion}</span>
                            <span className="text-gray-500">at {Math.floor(moment.time)}s</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {expressionInsights.timelineAnalysis.lowMoments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Challenging Moments</h4>
                      <div className="space-y-2">
                        {expressionInsights.timelineAnalysis.lowMoments.map((moment: any, index: number) => (
                          <div key={index} className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 bg-orange-500 rounded-full" />
                            <span className="text-gray-300">{moment.emotion}</span>
                            <span className="text-gray-500">at {Math.floor(moment.time)}s</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                <div className="bg-dark-800/60 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Award className="w-6 h-6 text-orange-400" />
                    <h3 className="text-xl font-bold text-white">Recommendations</h3>
                  </div>

                  <div className="space-y-4">
                    {expressionInsights.recommendations.map((recommendation: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-300 leading-relaxed">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InterviewResults;
