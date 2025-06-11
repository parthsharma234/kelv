import React from 'react';
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
  MessageSquare
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
          <p className="text-gray-400 text-lg">Here's your detailed performance analysis</p>
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
              <div className="text-3xl font-bold text-white mb-2">{sessionData.setup.experienceLevel.split(' ')[0]}</div>
              <p className="text-gray-400 text-sm">Level</p>
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
                Question Breakdown
              </h3>
              
              <div className="space-y-6">
                {sessionData.responses.map((response: any, index: number) => {
                  const question = sessionData.questions.find((q: any) => q.id === response.questionId);
                  return (
                    <div key={response.questionId} className="border border-dark-600/50 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-medium text-gray-400">Question {index + 1}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              question?.type === 'behavioral'
                                ? 'bg-purple-500/20 text-purple-400'
                                : question?.type === 'technical'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              {question?.type}
                            </span>
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
                      
                      {response.analysis && (
                        <div className="space-y-3">
                          <div>
                            <h5 className="text-sm font-medium text-gray-400 mb-2">Feedback</h5>
                            <p className="text-gray-300 text-sm">{response.analysis.feedback}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="text-sm font-medium text-green-400 mb-2">Strengths</h5>
                              <ul className="space-y-1">
                                {response.analysis.strengths.map((strength: string, idx: number) => (
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
                                {response.analysis.areasForImprovement.map((area: string, idx: number) => (
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
            {/* Performance Insights */}
            <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-orange-400" />
                Key Insights
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-dark-700/30 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Overall Performance</h4>
                  <p className="text-sm text-gray-400">
                    {sessionData.overallScore >= 80 
                      ? "Excellent performance! You demonstrated strong interview skills across all areas."
                      : sessionData.overallScore >= 60
                      ? "Good performance with room for improvement. Focus on providing more specific examples."
                      : "Keep practicing! Focus on structuring your responses and providing concrete examples."
                    }
                  </p>
                </div>
                
                <div className="p-4 bg-dark-700/30 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Communication Style</h4>
                  <p className="text-sm text-gray-400">
                    Your responses show {sessionData.responses.length > 3 ? 'consistent' : 'developing'} communication skills. 
                    Continue practicing to build confidence and clarity.
                  </p>
                </div>
                
                <div className="p-4 bg-dark-700/30 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Next Steps</h4>
                  <p className="text-sm text-gray-400">
                    Practice more {sessionData.setup.jobType} interviews and focus on the STAR method 
                    for behavioral questions.
                  </p>
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
                  Practice Again
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
              <h3 className="text-lg font-semibold text-white mb-4">Interview Details</h3>
              
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
                  <span className="text-gray-400">Date:</span>
                  <span className="text-white">
                    {new Date(sessionData.startTime).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default InterviewResults;