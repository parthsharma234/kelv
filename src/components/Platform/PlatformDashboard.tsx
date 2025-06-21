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
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { InterviewHistory } from '../../types/interview';
import { getInterviewHistory, getInterviewStats, getUserStrengthsAndWeaknesses } from '../../utils/supabase-interview';

// Utility function to convert camelCase to readable text
const formatInterviewType = (type: string): string => {
  if (!type) return 'Various';
  
  // Special case mappings for specific interview types
  const typeMap: { [key: string]: string } = {
    'salaryNegotiation': 'Salary Negotiation',
    'culturalFit': 'Cultural Fit',
    'problemSolving': 'Problem Solving',
    'systemDesign': 'System Design',
    'caseStudy': 'Case Study',
    'leadershipAssessment': 'Leadership Assessment',
  };
  
  // If we have a specific mapping, use it
  if (typeMap[type]) {
    return typeMap[type];
  }
  
  // Otherwise, convert camelCase to readable format
  return type
    // Insert space before uppercase letters
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Capitalize first letter of each word
    .replace(/\b\w/g, letter => letter.toUpperCase());
};

interface PlatformDashboardProps {
  onStartInterview: () => void;
  onStartFocusedInterview: () => void;
  onViewInterviewResults: (id: string, interviewType?: string | null) => void;
}

const PlatformDashboard: React.FC<PlatformDashboardProps> = ({ onStartInterview, onStartFocusedInterview, onViewInterviewResults }) => {
  const [interviewHistory, setInterviewHistory] = useState<InterviewHistory[]>([]);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    totalHours: 0,
    improvement: 0,
    focusedInterviews: 0,
    focusedAverageScore: 0,
    mostPracticedType: ''
  });
  const [strengthsAndWeaknesses, setStrengthsAndWeaknesses] = useState({
    strengths: [] as string[],
    weaknesses: [] as string[],
    categories: {} as { [key: string]: number }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const loadData = async () => {
      try {
        const [history, statsData, swData] = await Promise.all([
          getInterviewHistory(),
          getInterviewStats(),
          getUserStrengthsAndWeaknesses()
        ]);
        
        setInterviewHistory(history);
        setStats(statsData);
        setStrengthsAndWeaknesses(swData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
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
          <p className="text-gray-400 text-lg">Practice with dynamic interviews that adapt to your responses in real-time.</p>
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
            <div className="text-3xl font-bold text-white">
              {isLoading ? '...' : stats.totalInterviews}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {isLoading ? 'Loading...' : stats.totalInterviews > 0 ? `${Math.round(stats.totalHours * 60)} minutes practiced` : 'Ready to start your journey!'}
            </div>
          </div>

          <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Award className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-gray-400 text-sm">Average Score</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {isLoading ? '...' : stats.totalInterviews > 0 ? `${stats.averageScore}%` : '--'}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {isLoading ? 'Loading...' : stats.totalInterviews > 0 ? 
                (stats.averageScore >= 80 ? 'Excellent performance!' : 
                 stats.averageScore >= 60 ? 'Good progress, keep practicing!' : 
                 'Keep practicing to improve') : 
                'Your first interview awaits'}
            </div>
          </div>

          <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-gray-400 text-sm">Practice Hours</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {isLoading ? '...' : stats.totalInterviews > 0 ? `${stats.totalHours}h` : '0h'}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {isLoading ? 'Loading...' : stats.totalInterviews > 0 ? 
                (stats.totalHours > 10 ? 'Dedicated practice time!' : 
                 stats.totalHours > 5 ? 'Building momentum' : 
                 'Consistent practice pays off') : 
                'Begin your practice today'}
            </div>
          </div>

          <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-gray-400 text-sm">Improvement</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {isLoading ? '...' : stats.totalInterviews > 0 ? `${stats.improvement > 0 ? '+' : ''}${stats.improvement}%` : '--'}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {isLoading ? 'Loading...' : stats.totalInterviews > 0 ? 
                (stats.improvement > 10 ? 'Outstanding growth!' : 
                 stats.improvement > 0 ? 'Steady improvement' : 
                 'Focus on consistent practice') : 
                'Start practicing to see growth'}
            </div>
          </div>
        </motion.div>        {/* Focused Interview Stats - Only show when user has completed focused interviews */}
        {stats.focusedInterviews > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-12"
          >
            {/* Focused Stats Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Focused Practice Stats</h2>
              <div className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full border border-blue-500/30">
                Focused
              </div>
            </div>

            {/* Focused Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-900/70 to-cyan-900/40 rounded-2xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/30 rounded-lg">
                    <Target className="w-5 h-5 text-blue-300" />
                  </div>
                  <span className="text-blue-200 text-sm font-medium">Focused Sessions</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {stats.focusedInterviews}
                </div>
                <div className="text-xs text-blue-300 mt-2">
                  Targeted practice completed
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-900/70 to-cyan-900/40 rounded-2xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/30 rounded-lg">
                    <Award className="w-5 h-5 text-blue-300" />
                  </div>
                  <span className="text-blue-200 text-sm font-medium">Focused Score</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {stats.focusedAverageScore}%
                </div>
                <div className="text-xs text-blue-300 mt-2">
                  Average focused practice score
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-900/70 to-cyan-900/40 rounded-2xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/30 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-300" />
                  </div>
                  <span className="text-blue-200 text-sm font-medium">Most Practiced</span>
                </div>                <div className="text-3xl font-bold text-white">
                  {formatInterviewType(stats.mostPracticedType)}
                </div>
                <div className="text-xs text-blue-300 mt-2">
                  Your preferred practice type
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Strengths and Weaknesses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12"
        >
          {/* Strengths */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-2xl p-6 border border-green-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Your Strengths</h3>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-gray-700/50 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-700/50 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-700/50 rounded animate-pulse w-1/2"></div>
              </div>
            ) : strengthsAndWeaknesses.strengths.length > 0 ? (
              <div className="space-y-3">
                {strengthsAndWeaknesses.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-300 text-sm">{strength}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Complete more interviews to see your strengths</p>
            )}
          </div>

          {/* Areas for Improvement */}
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/5 rounded-2xl p-6 border border-orange-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Areas for Improvement</h3>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-gray-700/50 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-700/50 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-700/50 rounded animate-pulse w-1/2"></div>
              </div>
            ) : strengthsAndWeaknesses.weaknesses.length > 0 ? (
              <div className="space-y-3">
                {strengthsAndWeaknesses.weaknesses.map((weakness, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-300 text-sm">{weakness}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Great job! Keep practicing to maintain your skills</p>
            )}
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
                  <h2 className="text-2xl font-bold text-white mb-2">Dynamic Interview</h2>
                  <p className="text-gray-300">Experience adaptive questioning that adjusts difficulty based on your responses</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-dark-800/30 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">🧠 Smart Adaptation</h4>
                  <p className="text-sm text-gray-400">Questions adjust difficulty based on your performance</p>
                </div>
                <div className="bg-dark-800/30 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">⚡ Real-time Analysis</h4>
                  <p className="text-sm text-gray-400">Instant feedback and performance insights</p>
                </div>
                <div className="bg-dark-800/30 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">🎯 Realistic Flow</h4>
                  <p className="text-sm text-gray-400">Natural interview progression like real interviews</p>
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

            {/* Focused Practice Section */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-2xl p-8 border border-blue-500/20 mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Focused Practice</h2>
                  <p className="text-gray-300">Quick 3-5 minute sessions targeting specific interview skills</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-dark-800/30 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">💻</div>
                  <h4 className="font-medium text-white mb-1">Technical</h4>
                  <p className="text-xs text-gray-400">5 min</p>
                </div>
                <div className="bg-dark-800/30 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🎯</div>
                  <h4 className="font-medium text-white mb-1">Behavioral</h4>
                  <p className="text-xs text-gray-400">4 min</p>
                </div>
                <div className="bg-dark-800/30 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🧩</div>
                  <h4 className="font-medium text-white mb-1">Situational</h4>
                  <p className="text-xs text-gray-400">4 min</p>
                </div>
                <div className="bg-dark-800/30 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">👑</div>
                  <h4 className="font-medium text-white mb-1">Leadership</h4>
                  <p className="text-xs text-gray-400">5 min</p>
                </div>
              </div>
              
              <button
                onClick={onStartFocusedInterview}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-400 hover:to-cyan-400 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3 group"
              >
                <Target className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Start Focused Practice
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

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading interview history...</p>
                </div>
              ) : interviewHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-gray-500" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-400 mb-2">No interviews yet</h4>
                  <p className="text-gray-500 text-sm">Start your first interview to see your progress here</p>
                </div>
              ) : (                <div className="space-y-4">
                  {interviewHistory.slice(0, 5).map((interview) => {
                    const isFocusedInterview = interview.interviewType !== null && interview.interviewType !== undefined;
                    return (
                      <div
                        key={interview.id}
                        className={`flex items-center justify-between p-4 rounded-xl hover:bg-dark-700/50 transition-colors cursor-pointer border ${
                          isFocusedInterview 
                            ? 'bg-gradient-to-r from-blue-900/70 to-cyan-900/40 border-blue-500/50 shadow-blue-500/20' 
                            : 'bg-dark-700/30 border-dark-700'
                        }`}
                        onClick={() => onViewInterviewResults(interview.id, isFocusedInterview ? interview.interviewType : null)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${isFocusedInterview ? 'bg-blue-500/30' : 'bg-orange-500/20'}`}> 
                            <Calendar className={`w-4 h-4 ${isFocusedInterview ? 'text-blue-300' : 'text-orange-400'}`} />
                          </div>
                          <div>
                            <h4 className="font-medium text-white flex items-center gap-2">
                              {interview.setup.jobType} - {interview.setup.industry}
                              {isFocusedInterview && (
                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/40 text-blue-200 border border-blue-400/50" title="Targeted (Focused) Interview">Focused</span>
                              )}
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
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Tips & Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Features */}
            <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-orange-400" />
                Platform Features
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-dark-700/30 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Dynamic Questions</h4>
                  <p className="text-sm text-gray-400">Questions generated based on your responses and adapt difficulty in real-time.</p>
                </div>
                <div className="p-4 bg-dark-700/30 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Smart Follow-ups</h4>
                  <p className="text-sm text-gray-400">Get follow-up questions that dig deeper into your answers, just like real interviews.</p>
                </div>
                <div className="p-4 bg-dark-700/30 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Natural Conclusion</h4>
                  <p className="text-sm text-gray-400">The system knows when to end the interview at an appropriate time based on your performance.</p>
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
                    <div className={`p-3 rounded-lg border ${
                      stats.improvement > 0 
                        ? 'bg-green-500/10 border-green-500/20' 
                        : 'bg-red-500/10 border-red-500/20'
                    }`}>
                      <p className={`text-sm ${
                        stats.improvement > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {stats.improvement > 0 ? '📈' : '📉'} You've {stats.improvement > 0 ? 'improved' : 'declined'} by {Math.abs(stats.improvement)}% over your recent interviews
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Interview Tips */}
            <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-400" />
                Pro Tips
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">Start with confidence - the system begins with small talk to help you warm up</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">Use specific examples - the system recognizes and rewards concrete details</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">Don't worry about mistakes - the system adapts and helps you improve</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PlatformDashboard;