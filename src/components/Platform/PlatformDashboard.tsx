import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Play, 
  BarChart3, 
  Clock, 
  Target, 
  TrendingUp,
  Calendar,
  Award,
  ChevronRight,
  Plus
} from 'lucide-react';
import { InterviewHistory } from '../../types/interview';

interface PlatformDashboardProps {
  onStartInterview: () => void;
}

const PlatformDashboard: React.FC<PlatformDashboardProps> = ({ onStartInterview }) => {
  const [interviewHistory, setInterviewHistory] = useState<InterviewHistory[]>([]);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    totalHours: 0,
    improvement: 0
  });

  useEffect(() => {
    // Load interview history from localStorage
    const savedHistory = localStorage.getItem('kelv-interview-history');
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      setInterviewHistory(history);
      
      // Calculate stats
      const totalInterviews = history.length;
      const averageScore = history.reduce((sum: number, interview: InterviewHistory) => sum + interview.overallScore, 0) / totalInterviews || 0;
      const totalHours = history.reduce((sum: number, interview: InterviewHistory) => sum + interview.duration, 0) / 3600; // Convert to hours
      
      // Calculate improvement (compare last 3 vs first 3 interviews)
      let improvement = 0;
      if (totalInterviews >= 6) {
        const recent = history.slice(-3).reduce((sum: number, interview: InterviewHistory) => sum + interview.overallScore, 0) / 3;
        const initial = history.slice(0, 3).reduce((sum: number, interview: InterviewHistory) => sum + interview.overallScore, 0) / 3;
        improvement = ((recent - initial) / initial) * 100;
      }
      
      setStats({
        totalInterviews,
        averageScore: Math.round(averageScore),
        totalHours: Math.round(totalHours * 10) / 10,
        improvement: Math.round(improvement)
      });
    }
  }, []);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-dark-900 pt-24 pb-16">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold gradient-text mb-4">Interview Platform</h1>
          <p className="text-gray-400 text-lg">Practice, improve, and track your interview performance with AI-powered insights.</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Target className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-gray-400 text-sm">Total Interviews</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalInterviews}</div>
          </div>

          <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Award className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-gray-400 text-sm">Average Score</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.averageScore}%</div>
          </div>

          <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-gray-400 text-sm">Practice Hours</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalHours}h</div>
          </div>

          <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-gray-400 text-sm">Improvement</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Start Interview Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-400/5 rounded-2xl p-8 border border-orange-500/20 mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Start New Interview</h2>
                  <p className="text-gray-300">Practice with AI-powered mock interviews tailored to your goals</p>
                </div>
              </div>
              
              <button
                onClick={onStartInterview}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-xl font-semibold hover:from-orange-400 hover:to-orange-300 transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-3 group"
              >
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Start Interview
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Recent Interviews */}
            <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-orange-400" />
                  Recent Interviews
                </h3>
                {interviewHistory.length > 0 && (
                  <button className="text-orange-400 hover:text-orange-300 text-sm font-medium">
                    View All
                  </button>
                )}
              </div>

              {interviewHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-gray-500" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-400 mb-2">No interviews yet</h4>
                  <p className="text-gray-500 text-sm">Start your first mock interview to see your progress here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {interviewHistory.slice(0, 5).map((interview) => (
                    <div
                      key={interview.id}
                      className="flex items-center justify-between p-4 bg-dark-700/30 rounded-xl hover:bg-dark-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                          <Calendar className="w-4 h-4 text-orange-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">
                            {interview.setup.jobType} - {interview.setup.industry}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {formatDate(interview.date)} • {formatDuration(interview.duration)} • {interview.questionsAnswered} questions
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          interview.overallScore >= 80
                            ? 'bg-green-500/20 text-green-400'
                            : interview.overallScore >= 60
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {interview.overallScore}%
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions & Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Quick Tips */}
            <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-orange-400" />
                Interview Tips
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-dark-700/30 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Use the STAR Method</h4>
                  <p className="text-sm text-gray-400">Structure your answers with Situation, Task, Action, and Result for behavioral questions.</p>
                </div>
                <div className="p-4 bg-dark-700/30 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Practice Out Loud</h4>
                  <p className="text-sm text-gray-400">Speaking your answers helps you sound more natural and confident during real interviews.</p>
                </div>
                <div className="p-4 bg-dark-700/30 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Prepare Questions</h4>
                  <p className="text-sm text-gray-400">Always have thoughtful questions ready to ask your interviewer about the role and company.</p>
                </div>
              </div>
            </div>

            {/* Performance Insights */}
            {stats.totalInterviews > 0 && (
              <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                  Your Progress
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Overall Performance</span>
                      <span className="text-white font-medium">{stats.averageScore}%</span>
                    </div>
                    <div className="w-full bg-dark-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${stats.averageScore}%` }}
                      />
                    </div>
                  </div>
                  
                  {stats.improvement !== 0 && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-sm text-green-400">
                        {stats.improvement > 0 ? '📈' : '📉'} You've {stats.improvement > 0 ? 'improved' : 'declined'} by {Math.abs(stats.improvement)}% over your recent interviews
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PlatformDashboard;