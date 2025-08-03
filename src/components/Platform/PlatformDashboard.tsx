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
  AlertCircle,
  GraduationCap,
  Shield,
  Star,
  MessageSquare
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

// Utility function to format college interview titles
const formatCollegeInterviewTitle = (setup: any): string => {
  // For college interviews, setup contains schoolType, program, major directly
  if (setup.schoolType && setup.major) {
    const { schoolType, major } = setup;
    
    // Format school type
    const schoolTypeMap: { [key: string]: string } = {
      'public': 'Public University',
      'private': 'Private University',
      'ivy-league': 'Ivy League',
      'liberal-arts': 'Liberal Arts College',
      'community': 'Community College',
      'technical': 'Technical Institute'
    };
    
    // Format major (convert kebab-case to Title Case)
    const formattedMajor = major
      .split('-')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const formattedSchoolType = schoolTypeMap[schoolType] || schoolType.charAt(0).toUpperCase() + schoolType.slice(1);
    
    return `${formattedMajor} - ${formattedSchoolType}`;
  }
  
  // Fallback for legacy format or if data is missing
  if (typeof setup === 'string') {
    // Handle legacy format: "schoolType - major"
    const parts = setup.split(' - ');
    if (parts.length !== 2) return setup;
    
    const [schoolType, major] = parts;
    
    const schoolTypeMap: { [key: string]: string } = {
      'public': 'Public University',
      'private': 'Private University',
      'ivy-league': 'Ivy League',
      'liberal-arts': 'Liberal Arts College',
      'community': 'Community College',
      'technical': 'Technical Institute'
    };
    
    const formattedMajor = major
      .split('-')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const formattedSchoolType = schoolTypeMap[schoolType] || schoolType.charAt(0).toUpperCase() + schoolType.slice(1);
    
    return `${formattedMajor} - ${formattedSchoolType}`;
  }
  
  return 'College Interview';
};

interface PlatformDashboardProps {
  onStartRealtimeInterview: (type: 'standard' | 'focused', focusedType?: string) => void;
  onViewInterviewResults: (id: string, interviewType?: string | null) => void;
}

const PlatformDashboard: React.FC<PlatformDashboardProps> = ({ onStartRealtimeInterview, onViewInterviewResults }) => {
  const [interviewHistory, setInterviewHistory] = useState<InterviewHistory[]>([]);
  const [showAllInterviews, setShowAllInterviews] = useState(false);
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
  const [interviewTypeFilter, setInterviewTypeFilter] = useState<string | null>(null);

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
        
        console.log('Dashboard: Loaded interview history:', {
          total: history.length,
          histories: history.map(h => ({
            id: h.id,
            interviewType: h.interviewType,
            date: h.date,
            status: h.status,
            overallScore: h.overallScore
          }))
        });
        
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
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            className={`px-4 py-2 rounded-lg font-semibold border transition-colors ${interviewTypeFilter === 'focused' ? 'bg-blue-600 text-white border-blue-700' : 'bg-dark-800 text-blue-400 border-blue-700 hover:bg-blue-900/40'}`}
            onClick={() => setInterviewTypeFilter('focused')}
          >
            View Focused Practice
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold border transition-colors ${interviewTypeFilter === 'dynamic' ? 'bg-orange-600 text-white border-orange-700' : 'bg-dark-800 text-orange-400 border-orange-700 hover:bg-orange-900/40'}`}
            onClick={() => setInterviewTypeFilter('dynamic')}
          >
            View Dynamic Interviews
          </button>
          {interviewTypeFilter && (
            <button
              className="px-4 py-2 rounded-lg font-semibold border bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-800 transition-colors"
              onClick={() => setInterviewTypeFilter(null)}
            >
              Clear Filter
            </button>
          )}
        </div>
        {/* Recent Interviews - moved to top */}
        <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              Recent Interviews
            </h3>
            {interviewHistory.length > 5 && (
              <button 
                onClick={() => setShowAllInterviews(!showAllInterviews)}
                className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
              >
                {showAllInterviews ? 'Show Recent' : 'View All'}
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
          ) : (
            <div className={`space-y-4 ${showAllInterviews ? 'max-h-96 overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
              {(showAllInterviews ? interviewHistory : interviewHistory.slice(0, 5))
                .filter(interview => {
                  if (!interviewTypeFilter) return true;
                  if (interviewTypeFilter === 'focused') return interview.interviewType && interview.interviewType !== 'dynamic';
                  if (interviewTypeFilter === 'dynamic') return !interview.interviewType || interview.interviewType === 'general' || interview.interviewType === 'dynamic';
                  return true;
                })
                .map((interview) => {
                  const isFocusedInterview = interview.interviewType !== null && interview.interviewType !== undefined;
                  
                  console.log('Dashboard: Rendering interview:', {
                    id: interview.id,
                    interviewType: interview.interviewType,
                    isFocused: isFocusedInterview,
                    date: interview.date,
                    status: interview.status
                  });
                  
                  return (
                    <div
                      key={interview.id}
                      className={`flex items-center justify-between p-4 rounded-xl hover:bg-dark-700/50 transition-colors cursor-pointer border ${
                        isFocusedInterview
                          ? 'bg-gradient-to-r from-blue-900/70 to-cyan-900/40 border-blue-500/50 shadow-blue-500/20' 
                          : 'bg-dark-700/30 border-dark-700'
                      }`}
                      onClick={() => onViewInterviewResults(interview.id, interview.interviewType)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          isFocusedInterview ? 'bg-blue-500/30' : 'bg-orange-500/20'
                        }`}> 
                          <Calendar className={`w-4 h-4 ${
                            isFocusedInterview ? 'text-blue-300' : 'text-orange-400'
                          }`} />
                        </div>                          <div>                            <h4 className="font-medium text-white flex items-center gap-2">
                              {`${interview.setup.jobType} - ${interview.setup.industry}`}
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
        </motion.div>

        {/* Dynamic Interviews Performance bar - now below stats grid */}
        {interviewHistory && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-orange-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Dynamic Interviews Performance</h2>
              <div className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full border border-orange-500/30">
                Dynamic
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Sessions Card */}
              <div className="bg-gradient-to-br from-orange-900/70 to-amber-900/40 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-400/50 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-500/30 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-orange-300" />
                  </div>
                  <span className="text-orange-200 text-sm font-medium">Dynamic Sessions</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {interviewHistory.filter(i => !i.interviewType || i.interviewType === 'general' || i.interviewType === 'dynamic').length}
                </div>
                <div className="text-xs text-orange-300 mt-2">
                  Adaptive interviews completed
                </div>
              </div>
              {/* Overall Score Card */}
              <div className="bg-gradient-to-br from-orange-900/70 to-amber-900/40 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-400/50 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-500/30 rounded-lg">
                    <Award className="w-5 h-5 text-orange-300" />
                  </div>
                  <span className="text-orange-200 text-sm font-medium">Overall Score</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {(() => {
                    const dynamic = interviewHistory.filter(i => !i.interviewType || i.interviewType === 'general' || i.interviewType === 'dynamic');
                    if (dynamic.length === 0) return '--';
                    return Math.round(dynamic.reduce((sum, i) => sum + i.overallScore, 0) / dynamic.length) + '%';
                  })()}
                </div>
                <div className="text-xs text-orange-300 mt-2">
                  Average dynamic interview score
                </div>
              </div>
            </div>
            {/* 2x2 grid for metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Problem Solving Card */}
                <div className="bg-gradient-to-br from-orange-900/70 to-amber-900/40 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-400/50 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-500/30 rounded-lg">
                      <Target className="w-5 h-5 text-orange-300" />
                    </div>
                    <span className="text-orange-200 text-sm font-medium">Problem Solving</span>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {(() => {
                      const dynamic = interviewHistory.filter(i => !i.interviewType || i.interviewType === 'general' || i.interviewType === 'dynamic');
                      const scores = dynamic.flatMap(i => (i as any).metrics?.problem_solving ? [(i as any).metrics.problem_solving] : []);
                      if (scores.length === 0) return '--';
                      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) + '/10';
                    })()}
                  </div>
                  <div className="text-xs text-orange-300 mt-2">
                    Avg. problem solving score
                  </div>
                </div>
                {/* Communication Card */}
                <div className="bg-gradient-to-br from-orange-900/70 to-amber-900/40 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-400/50 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-500/30 rounded-lg">
                      <MessageSquare className="w-5 h-5 text-orange-300" />
                    </div>
                    <span className="text-orange-200 text-sm font-medium">Communication</span>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {(() => {
                      const dynamic = interviewHistory.filter(i => !i.interviewType || i.interviewType === 'general' || i.interviewType === 'dynamic');
                      const scores = dynamic.flatMap(i => (i as any).metrics?.communication ? [(i as any).metrics.communication] : []);
                      if (scores.length === 0) return '--';
                      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) + '/10';
                    })()}
                  </div>
                  <div className="text-xs text-orange-300 mt-2">
                    Avg. communication score
                  </div>
                </div>
                {/* Depth Card */}
                <div className="bg-gradient-to-br from-orange-900/70 to-amber-900/40 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-400/50 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-500/30 rounded-lg">
                      <Brain className="w-5 h-5 text-orange-300" />
                    </div>
                    <span className="text-orange-200 text-sm font-medium">Depth</span>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {(() => {
                      const dynamic = interviewHistory.filter(i => !i.interviewType || i.interviewType === 'general' || i.interviewType === 'dynamic');
                      const scores = dynamic.flatMap(i => (i as any).metrics?.depth ? [(i as any).metrics.depth] : []);
                      if (scores.length === 0) return '--';
                      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) + '/10';
                    })()}
                  </div>
                  <div className="text-xs text-orange-300 mt-2">
                    Avg. depth score
                  </div>
                </div>
                {/* Relevance Card */}
                <div className="bg-gradient-to-br from-orange-900/70 to-amber-900/40 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-400/50 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-500/30 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-orange-300" />
                    </div>
                    <span className="text-orange-200 text-sm font-medium">Relevance</span>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {(() => {
                      const dynamic = interviewHistory.filter(i => !i.interviewType || i.interviewType === 'general' || i.interviewType === 'dynamic');
                      const scores = dynamic.flatMap(i => (i as any).metrics?.relevance ? [(i as any).metrics.relevance] : []);
                      if (scores.length === 0) return '--';
                      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) + '/10';
                    })()}
                  </div>
                  <div className="text-xs text-orange-300 mt-2">
                    Avg. relevance score
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Focused Interview Stats - Only show when user has completed focused interviews */}
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
                  <p className="text-gray-300">Experience adaptive voice questioning powered by advanced AI technology</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-dark-800/30 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">🎙️ Voice Interaction</h4>
                  <p className="text-sm text-gray-400">Natural voice conversation with AI interviewer</p>
                </div>
                <div className="bg-dark-800/30 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">⚡ Real-time Response</h4>
                  <p className="text-sm text-gray-400">Instant AI reactions and adaptive follow-ups</p>
                </div>
                <div className="bg-dark-800/30 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">📝 Live Transcript</h4>
                  <p className="text-sm text-gray-400">See conversation in real-time with speaker labels</p>
                </div>
              </div>
              
              <button
                onClick={() => onStartRealtimeInterview('standard')}
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
                  <p className="text-gray-300">Quick voice sessions targeting specific interview skills</p>
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
                onClick={() => onStartRealtimeInterview('focused')}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-400 hover:to-cyan-400 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3 group"
              >
                <Target className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Start Focused Practice
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>            {/* Quick Tips & Performance */}
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