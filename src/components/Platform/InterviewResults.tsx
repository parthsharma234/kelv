import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  TrendingUp, 
  Clock, 
  Target, 
  Brain,
  ArrowRight,
  BarChart3,
  Award,
  MessageSquare,
  Sparkles,
  Mic,
  Volume2,
  Activity,
  Zap
} from 'lucide-react';
import { saveInterviewSession } from '../../utils/supabase-interview';

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
  
  useEffect(() => {
    // Save session to Supabase when component mounts
    const saveSession = async () => {
      try {
        await saveInterviewSession(sessionData);
      } catch (error) {
        console.error('Failed to save session to Supabase:', error);
      }
    };

    saveSession();
  }, [sessionData]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400 bg-green-500/20';
    if (score >= 6) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const getOverallGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-400' };
    if (score >= 80) return { grade: 'A', color: 'text-green-400' };
    if (score >= 70) return { grade: 'B', color: 'text-yellow-400' };
    if (score >= 60) return { grade: 'C', color: 'text-orange-400' };
    return { grade: 'D', color: 'text-red-400' };
  };

  const overallGrade = getOverallGrade(sessionData.overallScore);

  // Calculate insights
  const avgConfidence = sessionData.responses.reduce((sum: number, r: any) => 
    sum + (r.analysis?.confidenceIndicators?.enthusiasm || 5), 0) / sessionData.responses.length;
  
  const hasSpecificExamples = sessionData.responses.some((r: any) => 
    r.analysis?.confidenceIndicators?.specificExamples);
  
  const questionTypes = sessionData.responses.reduce((acc: any, r: any) => {
    const question = sessionData.questions.find((q: any) => q.id === r.questionId);
    if (question) {
      acc[question.type] = (acc[question.type] || 0) + 1;
    }
    return acc;
  }, {});

  // Calculate speech metrics averages if available
  const speechMetricsAvailable = sessionData.speechMetrics && sessionData.speechMetrics.length > 0;
  let avgSpeechMetrics = null;
  
  if (speechMetricsAvailable) {
    const metrics = sessionData.speechMetrics.map((m: any) => m.metrics).filter(Boolean);
    if (metrics.length > 0) {
      avgSpeechMetrics = {
        voiceConfidence: Math.round(metrics.reduce((sum: number, m: any) => sum + (m.voiceConfidence || 0), 0) / metrics.length),
        fluencyScore: Math.round(metrics.reduce((sum: number, m: any) => sum + (m.fluencyScore || 0), 0) / metrics.length),
        speechRate: Number((metrics.reduce((sum: number, m: any) => sum + (m.speechRate || 0), 0) / metrics.length).toFixed(2)),
        clarity: Math.round(metrics.reduce((sum: number, m: any) => sum + (m.clarity || 0), 0) / metrics.length),
        delivery: Math.round(metrics.reduce((sum: number, m: any) => sum + (m.delivery || 0), 0) / metrics.length),
        fillerWordCount: Math.round(metrics.reduce((sum: number, m: any) => sum + (m.fillerWordCount || 0), 0) / metrics.length),
        averageVolume: Math.round(metrics.reduce((sum: number, m: any) => sum + (m.averageVolume || 0), 0) / metrics.length)
      };
    }
  }

  // Calculate skill breakdown metrics similar to hero section
  const skillBreakdownMetrics = [
    {
      name: "Communication Clarity",
      score: Math.round(sessionData.responses.reduce((sum: number, r: any) => 
        sum + (r.analysis?.score || 5), 0) / sessionData.responses.length * 10),
      icon: MessageSquare,
      color: "from-blue-500 to-blue-400",
      improvement: avgSpeechMetrics ? `+${Math.max(0, avgSpeechMetrics.clarity - 70)}%` : "+8%",
      description: "How clearly you communicate your ideas and thoughts"
    },
    {
      name: "Technical Depth",
      score: Math.round(sessionData.responses.filter((r: any) => {
        const question = sessionData.questions.find((q: any) => q.id === r.questionId);
        return question?.type === 'technical';
      }).reduce((sum: number, r: any) => sum + (r.analysis?.score || 5), 0) / 
      Math.max(1, sessionData.responses.filter((r: any) => {
        const question = sessionData.questions.find((q: any) => q.id === r.questionId);
        return question?.type === 'technical';
      }).length) * 10),
      icon: Brain,
      color: "from-purple-500 to-purple-400",
      improvement: "+12%",
      description: "Your technical knowledge and problem-solving abilities"
    },
    {
      name: "Response Quality",
      score: Math.round(sessionData.responses.reduce((sum: number, r: any) => 
        sum + (r.analysis?.confidenceIndicators?.structuredAnswer ? 8 : 5), 0) / sessionData.responses.length * 10),
      icon: Target,
      color: "from-green-500 to-green-400",
      improvement: "+15%",
      description: "Structure, relevance, and completeness of your answers"
    },
    {
      name: "Confidence Level",
      score: Math.round(avgConfidence * 10),
      icon: TrendingUp,
      color: "from-orange-500 to-orange-400",
      improvement: "+6%",
      description: "Your confidence and enthusiasm during the interview"
    }
  ];

  // Add voice-specific metrics if available
  if (avgSpeechMetrics) {
    skillBreakdownMetrics.push({
      name: "Voice Delivery",
      score: avgSpeechMetrics.delivery,
      icon: Mic,
      color: "from-pink-500 to-pink-400",
      improvement: `+${Math.max(0, avgSpeechMetrics.delivery - 60)}%`,
      description: "Your speaking pace, clarity, and vocal confidence"
    });
  }

  return (
    <div className="min-h-screen bg-dark-900 pt-24 pb-16">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-4">Interview Complete!</h1>
          <p className="text-gray-400 text-lg">Your dynamic interview session has been analyzed and saved</p>
        </motion.div>

        {/* Overall Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-orange-500/10 to-orange-400/5 rounded-2xl p-8 border border-orange-500/20 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold gradient-text mb-2">{sessionData.overallScore}%</div>
              <div className={`text-2xl font-bold ${overallGrade.color} mb-1`}>{overallGrade.grade}</div>
              <p className="text-gray-400 text-sm">Overall Score</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{formatTime(sessionData.duration)}</div>
              <p className="text-gray-400 text-sm">Duration</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{sessionData.responses.length}</div>
              <p className="text-gray-400 text-sm">Questions Answered</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                {sessionData.setup.interviewMode === 'voice' ? (
                  <Mic className="w-8 h-8 text-green-400" />
                ) : (
                  <MessageSquare className="w-8 h-8 text-blue-400" />
                )}
                Dynamic
              </div>
              <p className="text-gray-400 text-sm">
                {sessionData.setup.interviewMode === 'voice' ? 'Voice Interview' : 'Text Interview'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Skill Breakdown Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              Performance Breakdown
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skillBreakdownMetrics.map((metric, index) => (
                <motion.div
                  key={metric.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-dark-700/30 rounded-xl p-4 border border-dark-600/30 hover:border-orange-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.color} group-hover:scale-110 transition-transform`}>
                      <metric.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white truncate">{metric.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-white">{metric.score}%</span>
                          <span className="text-xs text-green-400">{metric.improvement}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.score}%` }}
                        transition={{ duration: 1.5, delay: 0.3 + index * 0.1 }}
                        className={`h-full bg-gradient-to-r ${metric.color} rounded-full relative`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                      </motion.div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-400">{metric.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Question Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-orange-400" />
                Interview Flow
              </h3>
              
              <div className="space-y-6">
                {sessionData.responses.map((response: any, index: number) => {
                  const question = sessionData.questions.find((q: any) => q.id === response.questionId);
                  const speechMetric = sessionData.speechMetrics?.find((m: any) => m.questionId === response.questionId);
                  
                  return (
                    <div key={response.questionId} className="border border-dark-600/50 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-medium text-gray-400">Question {index + 1}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              question?.type === 'small_talk'
                                ? 'bg-blue-500/20 text-blue-400'
                                : question?.type === 'behavioral'
                                ? 'bg-purple-500/20 text-purple-400'
                                : question?.type === 'technical'
                                ? 'bg-green-500/20 text-green-400'
                                : question?.type === 'follow_up'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              {question?.type?.replace('_', ' ')}
                            </span>
                            {question?.difficulty && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                question.difficulty === 'easy'
                                  ? 'bg-green-500/20 text-green-400'
                                  : question.difficulty === 'medium'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {question.difficulty}
                              </span>
                            )}
                            {speechMetric && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                                <Mic className="w-3 h-3 inline mr-1" />
                                Voice
                              </span>
                            )}
                          </div>
                          <p className="text-white font-medium mb-3">{question?.text}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(response.analysis?.score || 0)}`}>
                          {response.analysis?.score || 0}/10
                        </div>
                      </div>
                      
                      <div className="bg-dark-700/30 rounded-lg p-4 mb-4">
                        <h5 className="text-sm font-medium text-gray-400 mb-2">Your Response</h5>
                        <p className="text-gray-300 text-sm">{response.response}</p>
                      </div>
                      
                      {/* Speech Metrics for this question */}
                      {speechMetric?.metrics && (
                        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 mb-4">
                          <h5 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                            <Volume2 className="w-4 h-4" />
                            Speech Analysis
                          </h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div className="text-center">
                              <div className="text-lg font-bold text-white">{speechMetric.metrics.voiceConfidence}%</div>
                              <div className="text-gray-400">Voice Confidence</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-white">{speechMetric.metrics.fluencyScore}%</div>
                              <div className="text-gray-400">Fluency</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-white">{Number(speechMetric.metrics.speechRate).toFixed(2)}</div>
                              <div className="text-gray-400">WPM</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-white">{speechMetric.metrics.clarity}%</div>
                              <div className="text-gray-400">Clarity</div>
                            </div>
                          </div>
                          {speechMetric.metrics.fillerWordCount > 0 && (
                            <div className="mt-3 text-xs text-yellow-400">
                              ⚠️ {speechMetric.metrics.fillerWordCount} filler words detected
                            </div>
                          )}
                        </div>
                      )}
                      
                      {response.analysis && (
                        <div className="space-y-3">
                          <div>
                            <h5 className="text-sm font-medium text-gray-400 mb-2">Feedback</h5>
                            <p className="text-gray-300 text-sm">{response.analysis.feedback}</p>
                          </div>
                          
                          {response.analysis.confidenceIndicators && (
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-gray-400">Confidence:</span>
                                <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                                  <div 
                                    className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${(response.analysis.confidenceIndicators.enthusiasm || 5) * 10}%` }}
                                  />
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400">Examples:</span>
                                <span className={`ml-2 ${response.analysis.confidenceIndicators.specificExamples ? 'text-green-400' : 'text-orange-400'}`}>
                                  {response.analysis.confidenceIndicators.specificExamples ? 'Good' : 'Improve'}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="text-sm font-medium text-green-400 mb-2">Strengths</h5>
                              <ul className="space-y-1">
                                {response.analysis.strengths?.slice(0, 2).map((strength: string, idx: number) => (
                                  <li key={idx} className="text-xs text-gray-300 flex items-center">
                                    <CheckCircle className="w-3 h-3 mr-2 text-green-400" />
                                    {strength}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h5 className="text-sm font-medium text-orange-400 mb-2">Areas for Improvement</h5>
                              <ul className="space-y-1">
                                {response.analysis.areasForImprovement?.slice(0, 2).map((area: string, idx: number) => (
                                  <li key={idx} className="text-xs text-gray-300 flex items-center">
                                    <Target className="w-3 h-3 mr-2 text-orange-400" />
                                    {area}
                                  </li>
                                ))}
                              </ul>
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

          {/* Insights & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Speech Metrics Summary */}
            {avgSpeechMetrics && (
              <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  Speech Performance
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-dark-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">{avgSpeechMetrics.voiceConfidence}%</div>
                      <div className="text-xs text-gray-400">Voice Confidence</div>
                    </div>
                    <div className="text-center p-3 bg-dark-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">{avgSpeechMetrics.fluencyScore}%</div>
                      <div className="text-xs text-gray-400">Fluency Score</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-dark-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-purple-400">{Number(avgSpeechMetrics.speechRate).toFixed(2)}</div>
                      <div className="text-xs text-gray-400">Words/Min</div>
                    </div>
                    <div className="text-center p-3 bg-dark-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-orange-400">{avgSpeechMetrics.clarity}%</div>
                      <div className="text-xs text-gray-400">Clarity</div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-dark-700/30 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Speech Insights</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Delivery Score:</span>
                        <span className="text-white">{avgSpeechMetrics.delivery}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Filler Words:</span>
                        <span className={avgSpeechMetrics.fillerWordCount > 3 ? 'text-yellow-400' : 'text-green-400'}>
                          {avgSpeechMetrics.fillerWordCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Voice Volume:</span>
                        <span className="text-white">{avgSpeechMetrics.averageVolume}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Analysis */}
            <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-orange-400" />
                Analysis
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-dark-700/30 rounded-lg">
                  <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    Adaptive Performance
                  </h4>
                  <p className="text-sm text-gray-400">
                    {sessionData.overallScore >= 80 
                      ? "Excellent! The system recognized your strong performance and provided appropriately challenging questions."
                      : sessionData.overallScore >= 60
                      ? "Good progress! The system adapted to help you improve throughout the interview."
                      : "The system provided supportive questions to help build your confidence. Keep practicing!"
                    }
                  </p>
                </div>
                
                <div className="p-4 bg-dark-700/30 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Question Flow</h4>
                  <div className="space-y-2">
                    {Object.entries(questionTypes).map(([type, count]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="text-gray-400 capitalize">{type.replace('_', ' ')}:</span>
                        <span className="text-white">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 bg-dark-700/30 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Communication Style</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Avg Confidence:</span>
                      <span className="text-white">{Math.round(avgConfidence)}/10</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Used Examples:</span>
                      <span className={hasSpecificExamples ? 'text-green-400' : 'text-orange-400'}>
                        {hasSpecificExamples ? 'Yes' : 'Improve'}
                      </span>
                    </div>
                    {avgSpeechMetrics && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Speech Quality:</span>
                        <span className={avgSpeechMetrics.voiceConfidence >= 70 ? 'text-green-400' : 'text-orange-400'}>
                          {avgSpeechMetrics.voiceConfidence >= 70 ? 'Strong' : 'Developing'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4">What's Next?</h3>
              
              <div className="space-y-3">
                <button
                  onClick={onStartNewInterview}
                  className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-xl font-medium hover:from-orange-400 hover:to-orange-300 transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
                >
                  <Brain className="w-5 h-5" />
                  New Interview
                  <ArrowRight className="w-4 h-4" />
                </button>
                
                <button
                  onClick={onBackToDashboard}
                  className="w-full px-6 py-3 bg-dark-700 text-white rounded-xl font-medium hover:bg-dark-600 transition-colors flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-5 h-5" />
                  View Dashboard
                </button>
              </div>
            </div>

            {/* Interview Details */}
            <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4">Session Details</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Industry:</span>
                  <span className="text-white">{sessionData.setup.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Role:</span>
                  <span className="text-white">{sessionData.setup.jobType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Experience:</span>
                  <span className="text-white">{sessionData.setup.experienceLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mode:</span>
                  <span className="text-white flex items-center gap-1">
                    {sessionData.setup.interviewMode === 'voice' ? (
                      <>
                        <Mic className="w-3 h-3" />
                        Voice Interview
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-3 h-3" />
                        Text Interview
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-white">
                    {new Date(sessionData.startTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Model:</span>
                  <span className="text-white">GPT-4o Dynamic</span>
                </div>
                {avgSpeechMetrics && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Speech Analysis:</span>
                    <span className="text-green-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Enabled
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default InterviewResults;