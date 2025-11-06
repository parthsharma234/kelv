import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Target,
  TrendingUp,
  Award,
  ArrowRight,
  Sparkles,
  Zap,
  Activity,
  MessageSquare,
  BarChart3,
  Circle,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Plus,
  Clock,
  Calendar,
  Trophy,
  Flame,
  Star,
  Rocket,
  TrendingDown,
  Command
} from 'lucide-react';
import { InterviewHistory } from '../../types/interview';
import { getInterviewHistory, getInterviewStats, getUserStrengthsAndWeaknesses } from '../../utils/supabase-interview';
import CommandPalette from './CommandPalette';
import { generateRecommendations, calculateAchievements, calculateStreak, Recommendation, Achievement, StreakData } from '../../utils/recommendations';

const formatInterviewType = (type: string): string => {
  if (!type) return 'Various';
  const typeMap: { [key: string]: string } = {
    'salaryNegotiation': 'Salary Negotiation',
    'culturalFit': 'Cultural Fit',
    'problemSolving': 'Problem Solving',
    'systemDesign': 'System Design',
    'caseStudy': 'Case Study',
    'leadershipAssessment': 'Leadership Assessment',
  };
  if (typeMap[type]) return typeMap[type];
  return type.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, letter => letter.toUpperCase());
};

interface PlatformDashboardProps {
  onStartRealtimeInterview: (type: 'standard' | 'focused', focusedType?: string) => void;
  onViewInterviewResults: (id: string, interviewType?: string | null) => void;
  onStartCustomDemoInterview?: () => void;
}

const PlatformDashboard: React.FC<PlatformDashboardProps> = ({
  onStartRealtimeInterview,
  onViewInterviewResults
}) => {
  const [interviewHistory, setInterviewHistory] = useState<InterviewHistory[]>([]);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    totalHours: 0,
    improvement: 0,
  });
  const [strengthsAndWeaknesses, setStrengthsAndWeaknesses] = useState({
    strengths: [] as string[],
    weaknesses: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'all' | 'dynamic' | 'focused'>('all');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastInterviewDate: null,
    interviewDates: [],
    streakCalendar: []
  });

  useEffect(() => {
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

        // Calculate recommendations, achievements, and streak
        const calculatedStreak = calculateStreak(history);
        setStreakData(calculatedStreak);

        const recs = generateRecommendations(history, swData);
        setRecommendations(recs);

        const achs = calculateAchievements(history, calculatedStreak);
        setAchievements(achs);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const focusedTypes = [
    { id: 'technical', label: 'Technical', icon: Brain, gradient: 'from-blue-500 via-blue-600 to-cyan-600', duration: '5m', color: 'blue' },
    { id: 'behavioral', label: 'Behavioral', icon: MessageSquare, gradient: 'from-purple-500 via-purple-600 to-pink-600', duration: '4m', color: 'purple' },
    { id: 'situational', label: 'Situational', icon: Zap, gradient: 'from-amber-500 via-orange-500 to-red-500', duration: '4m', color: 'orange' },
    { id: 'leadership', label: 'Leadership', icon: Award, gradient: 'from-emerald-500 via-teal-500 to-cyan-500', duration: '5m', color: 'emerald' },
    { id: 'problemSolving', label: 'Problem Solving', icon: Activity, gradient: 'from-indigo-500 via-violet-500 to-purple-600', duration: '5m', color: 'indigo' },
    { id: 'communication', label: 'Communication', icon: Sparkles, gradient: 'from-rose-500 via-pink-500 to-purple-500', duration: '4m', color: 'rose' },
  ];

  const dynamicInterviews = interviewHistory.filter(i => !i.interviewType || i.interviewType === 'general' || i.interviewType === 'dynamic');
  const focusedInterviews = interviewHistory.filter(i => i.interviewType && i.interviewType !== 'dynamic' && i.interviewType !== 'general');
  const filteredInterviews = selectedView === 'dynamic' ? dynamicInterviews :
                            selectedView === 'focused' ? focusedInterviews :
                            interviewHistory;

  // Use real streak from calculated data
  const currentStreak = streakData.currentStreak;

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      // Don't trigger shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't trigger if command palette is open
      if (isCommandPaletteOpen) {
        return;
      }

      // D for Dynamic interview
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        onStartRealtimeInterview('standard');
      }

      // Number keys for focused interviews
      if (e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (focusedTypes[index]) {
          onStartRealtimeInterview('focused', focusedTypes[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, onStartRealtimeInterview]);

  return (
    <div className="min-h-screen bg-dark-900 pt-20 pb-16">
      <div className="container max-w-[1600px] mx-auto px-6">

        {/* Hero Section with Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-10"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-5xl font-bold text-white tracking-tight">
                  Dashboard
                </h1>
                {currentStreak > 0 && (
                  <div className="relative group">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full cursor-pointer"
                    >
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-semibold text-orange-300">{currentStreak} day streak</span>
                    </motion.div>

                    {/* Streak Calendar Tooltip */}
                    <div className="absolute top-full left-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                      <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 shadow-2xl min-w-[280px]">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-white">Last 30 Days</span>
                          <span className="text-xs text-gray-500">Longest: {streakData.longestStreak} days</span>
                        </div>
                        <div className="grid grid-cols-10 gap-1">
                          {streakData.streakCalendar.map((day, idx) => (
                            <div
                              key={idx}
                              className={`w-5 h-5 rounded ${
                                day.hasInterview
                                  ? 'bg-orange-500'
                                  : 'bg-dark-700'
                              }`}
                              title={day.date.toLocaleDateString()}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <p className="text-base text-gray-400">Ready to practice your next interview?</p>

                {/* Command Palette Button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-dark-800/40 border border-dark-700/50 rounded-lg hover:border-dark-600 transition-all group"
                >
                  <Command className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />
                  <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Quick Actions</span>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-dark-700/50 rounded text-xs text-gray-500 font-mono">
                    <Command className="w-3 h-3" />
                    K
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            {!isLoading && stats.totalInterviews > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="grid grid-cols-3 gap-3"
              >
                <div className="bg-dark-800/40 border border-dark-700/50 rounded-xl px-4 py-3 min-w-[130px]">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-gray-500">Sessions</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.totalInterviews}</div>
                </div>

                <div className="bg-dark-800/40 border border-dark-700/50 rounded-xl px-4 py-3 min-w-[130px]">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-gray-500">Avg Score</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.averageScore}%</div>
                </div>

                <div className="bg-dark-800/40 border border-dark-700/50 rounded-xl px-4 py-3 min-w-[130px]">
                  <div className="flex items-center gap-2 mb-1">
                    {stats.improvement >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-xs text-gray-500">Trend</span>
                  </div>
                  <div className={`text-2xl font-bold ${stats.improvement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.improvement >= 0 ? '+' : ''}{stats.improvement}%
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* For You - Personalized Recommendations */}
        {!isLoading && recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-400" />
                For You
              </h2>
              <span className="text-sm text-gray-500">AI-powered suggestions</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
                  onClick={() => {
                    if (rec.action.interviewType === 'focused' && rec.action.focusedType) {
                      onStartRealtimeInterview('focused', rec.action.focusedType);
                    } else {
                      onStartRealtimeInterview('standard');
                    }
                  }}
                  className="group relative cursor-pointer"
                >
                  {/* Subtle Glow - Keep but reduce */}
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${rec.gradient} rounded-xl blur opacity-0 group-hover:opacity-30 transition-all duration-300`}></div>

                  {/* Card */}
                  <div className="relative bg-dark-800/40 border border-dark-700/50 rounded-xl p-5 group-hover:border-dark-600 transition-all h-full">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{rec.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-base font-semibold text-white">{rec.title}</h3>
                          {rec.priority >= 4 && (
                            <span className="px-2 py-0.5 bg-orange-500/20 border border-orange-500/30 rounded text-xs text-orange-300 font-medium">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{rec.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <ArrowRight className="w-3 h-3" />
                          <span>Start practice</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Achievements Showcase */}
        {!isLoading && achievements.some(a => a.unlocked) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Recent Achievements
              </h2>
              <span className="text-sm text-gray-500">
                {achievements.filter(a => a.unlocked).length} / {achievements.length} unlocked
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {achievements.filter(a => a.unlocked).slice(0, 6).map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 + index * 0.03, duration: 0.3 }}
                  className="group relative"
                >
                  {/* Subtle Glow for rare achievements */}
                  {achievement.rarity !== 'common' && (
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${achievement.gradient} rounded-xl blur opacity-0 group-hover:opacity-25 transition-all duration-300`}></div>
                  )}

                  {/* Achievement Card */}
                  <div className="relative bg-dark-800/40 border border-dark-700/50 rounded-xl p-4 group-hover:border-dark-600 transition-all text-center">
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <div className="text-xs font-semibold text-white mb-1 line-clamp-2">{achievement.title}</div>
                    <div className="text-xs text-gray-500">
                      {achievement.rarity === 'legendary' && 'Legendary'}
                      {achievement.rarity === 'epic' && 'Epic'}
                      {achievement.rarity === 'rare' && 'Rare'}
                      {achievement.rarity === 'common' && 'Common'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Main Interview Actions - Bento Grid Style */}
        <div className="grid grid-cols-12 gap-4 mb-6">

          {/* Dynamic Interview - Takes 8 columns */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="col-span-12 lg:col-span-8"
          >
            <motion.div
              onClick={() => onStartRealtimeInterview('standard')}
              onHoverStart={() => setHoveredCard('dynamic')}
              onHoverEnd={() => setHoveredCard(null)}
              className="group cursor-pointer h-full relative"
            >
              {/* Subtle Glow Effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-all duration-300"></div>

              {/* Card */}
              <div className="relative bg-dark-800/40 border border-dark-700/50 rounded-2xl p-8 hover:border-orange-500/30 transition-all h-full">

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(255, 255, 255) 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                  }}></div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-500/10 rounded-xl">
                        <Brain className="w-7 h-7 text-orange-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-2xl font-bold text-white">Dynamic Interview</h3>
                          <kbd className="px-2 py-1 bg-dark-900/60 border border-dark-700 rounded text-xs text-gray-400 font-mono">D</kbd>
                        </div>
                        <p className="text-gray-400 text-sm">Full 20-minute adaptive session</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-medium text-orange-300">20min</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    <div className="bg-dark-900/40 border border-dark-700/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Completed</div>
                      <div className="text-xl font-bold text-white">{dynamicInterviews.length}</div>
                    </div>
                    <div className="bg-dark-900/40 border border-dark-700/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Avg Score</div>
                      <div className="text-xl font-bold text-white">
                        {dynamicInterviews.length > 0
                          ? Math.round(dynamicInterviews.reduce((sum, i) => sum + i.overallScore, 0) / dynamicInterviews.length) + '%'
                          : '--'}
                      </div>
                    </div>
                    <div className="bg-dark-900/40 border border-dark-700/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Total Time</div>
                      <div className="text-xl font-bold text-white">
                        {dynamicInterviews.length > 0
                          ? Math.round(dynamicInterviews.reduce((sum, i) => sum + (i.duration / 60), 0)) + 'm'
                          : '--'}
                      </div>
                    </div>
                    <div className="bg-dark-900/40 border border-dark-700/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Best Score</div>
                      <div className="text-xl font-bold text-white">
                        {dynamicInterviews.length > 0
                          ? Math.max(...dynamicInterviews.map(i => i.overallScore)) + '%'
                          : '--'}
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-dark-700/50">
                    <span className="text-orange-300 font-semibold text-sm">Start Interview</span>
                    <motion.div
                      animate={{
                        x: hoveredCard === 'dynamic' ? 4 : 0
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowRight className="w-5 h-5 text-orange-400" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Performance Card - Takes 4 columns */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.3 }}
            className="col-span-12 lg:col-span-4"
          >
            <div className="bg-dark-800/40 border border-dark-700/50 rounded-2xl p-6 h-full">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Performance</h3>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-dark-700/50 rounded-lg animate-pulse"></div>
                  <div className="h-4 bg-dark-700/50 rounded-lg animate-pulse w-3/4"></div>
                </div>
              ) : stats.totalInterviews > 0 ? (
                <div className="space-y-6">
                  {/* Big Score */}
                  <div>
                    <div className="flex items-baseline gap-3 mb-3">
                      <div className="text-5xl font-bold text-white">{stats.averageScore}</div>
                      <div className="text-2xl text-gray-500">%</div>
                      {stats.improvement !== 0 && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                          stats.improvement > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {stats.improvement > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span className="text-sm font-semibold">{Math.abs(stats.improvement)}%</span>
                        </div>
                      )}
                    </div>
                    <div className="relative h-2 bg-dark-900 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.averageScore}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Sessions</span>
                      <span className="font-semibold text-white">{stats.totalInterviews}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Practice Time</span>
                      <span className="font-semibold text-white">{stats.totalHours.toFixed(1)}h</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">This Week</span>
                      <span className="font-semibold text-white">{interviewHistory.filter(i => {
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return new Date(i.date) >= weekAgo;
                      }).length}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Rocket className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Start your first interview</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Focused Practice Grid - Sleek */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Focused Practice</h2>
            <div className="text-sm text-gray-500">{focusedInterviews.length} completed</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {focusedTypes.map((type, index) => {
              const Icon = type.icon;
              const completedCount = focusedInterviews.filter(i => i.interviewType === type.id).length;

              return (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.03, duration: 0.3 }}
                  onClick={() => onStartRealtimeInterview('focused', type.id)}
                  onHoverStart={() => setHoveredCard(type.id)}
                  onHoverEnd={() => setHoveredCard(null)}
                  className="group cursor-pointer relative"
                >
                  {/* Subtle Glow */}
                  <div className={`absolute -inset-0.5 bg-${type.color}-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition-all duration-300`}></div>

                  {/* Card */}
                  <div className="relative bg-dark-800/40 border border-dark-700/50 rounded-xl p-4 group-hover:border-dark-600 transition-all h-full">
                    <div className="flex flex-col h-full">
                      {/* Icon with keyboard hint */}
                      <div className="mb-3 flex items-start justify-between">
                        <div className={`p-2.5 bg-${type.color}-500/10 rounded-lg inline-flex`}>
                          <Icon className={`w-5 h-5 text-${type.color}-400`} />
                        </div>
                        <kbd className="px-1.5 py-0.5 bg-dark-900/60 border border-dark-700 rounded text-xs text-gray-500 font-mono">{index + 1}</kbd>
                      </div>

                      {/* Label */}
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white mb-1 line-clamp-2">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.duration}</div>
                      </div>

                      {/* Progress */}
                      {completedCount > 0 && (
                        <div className="mt-3 pt-3 border-t border-dark-700/50">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Completed</span>
                            <span className="font-semibold text-white">{completedCount}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Insights & Activity - Side by Side */}
        <div className="grid grid-cols-12 gap-4">

          {/* Insights - 4 columns */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="col-span-12 lg:col-span-4 space-y-4"
          >
            {/* Strengths */}
            <div className="bg-dark-800/40 border border-dark-700/50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <h3 className="text-base font-semibold text-white">Strengths</h3>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-3 bg-dark-700/50 rounded animate-pulse"></div>
                  <div className="h-3 bg-dark-700/50 rounded animate-pulse w-3/4"></div>
                </div>
              ) : strengthsAndWeaknesses.strengths.length > 0 ? (
                <div className="space-y-3">
                  {strengthsAndWeaknesses.strengths.slice(0, 3).map((strength, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Circle className="w-1.5 h-1.5 text-green-400 mt-1.5 fill-current flex-shrink-0" />
                      <p className="text-sm text-gray-300 leading-relaxed">{strength}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Complete interviews to discover your strengths</p>
              )}
            </div>

            {/* Focus Areas */}
            <div className="bg-dark-800/40 border border-dark-700/50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-semibold text-white">Focus Areas</h3>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-3 bg-dark-700/50 rounded animate-pulse"></div>
                  <div className="h-3 bg-dark-700/50 rounded animate-pulse w-3/4"></div>
                </div>
              ) : strengthsAndWeaknesses.weaknesses.length > 0 ? (
                <div className="space-y-3">
                  {strengthsAndWeaknesses.weaknesses.slice(0, 3).map((weakness, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Circle className="w-1.5 h-1.5 text-orange-400 mt-1.5 fill-current flex-shrink-0" />
                      <p className="text-sm text-gray-300 leading-relaxed">{weakness}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">You're doing great! Keep practicing</p>
              )}
            </div>
          </motion.div>

          {/* Activity Feed - 8 columns */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.3 }}
            className="col-span-12 lg:col-span-8"
          >
            <div className="bg-dark-800/40 border border-dark-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Recent Activity</h3>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2">
                  {(['all', 'dynamic', 'focused'] as const).map((view) => (
                    <button
                      key={view}
                      onClick={() => setSelectedView(view)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedView === view
                          ? view === 'dynamic'
                            ? 'bg-orange-500/10 text-orange-300 border border-orange-500/20'
                            : view === 'focused'
                            ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                            : 'bg-white/10 text-white border border-white/20'
                          : 'text-gray-400 hover:text-white hover:bg-dark-700/50 border border-transparent'
                      }`}
                    >
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-dark-700 border-t-white rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-gray-500">Loading sessions...</p>
                </div>
              ) : filteredInterviews.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-dark-700/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-600" />
                  </div>
                  <h4 className="text-base font-semibold text-gray-400 mb-2">No sessions yet</h4>
                  <p className="text-sm text-gray-600">Start your first interview to begin tracking progress</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredInterviews.slice(0, 6).map((interview) => {
                    const isFocused = interview.interviewType && interview.interviewType !== 'dynamic' && interview.interviewType !== 'general';

                    return (
                      <motion.div
                        key={interview.id}
                        whileHover={{ scale: 1.005 }}
                        onClick={() => onViewInterviewResults(interview.id, interview.interviewType)}
                        className="group flex items-center gap-4 p-4 rounded-lg border border-dark-700/50 hover:border-dark-600 hover:bg-dark-700/30 transition-all cursor-pointer"
                      >
                        {/* Icon */}
                        <div className={`p-2.5 rounded-lg ${
                          isFocused ? 'bg-blue-500/10' : 'bg-orange-500/10'
                        }`}>
                          {isFocused ? (
                            <Target className="w-5 h-5 text-blue-400" />
                          ) : (
                            <Brain className="w-5 h-5 text-orange-400" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-white truncate">
                              {interview.setup.jobType}
                            </h4>
                            <span className="text-xs text-gray-600">•</span>
                            <span className="text-xs text-gray-500">{interview.setup.industry}</span>
                            {isFocused && (
                              <>
                                <span className="text-xs text-gray-600">•</span>
                                <span className="text-xs text-blue-400 truncate">{formatInterviewType(interview.interviewType || '')}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span>{formatDate(interview.date)}</span>
                            <span>•</span>
                            <span>{formatDuration(interview.duration)}</span>
                            <span>•</span>
                            <span>{interview.questionsAnswered} questions</span>
                          </div>
                        </div>

                        {/* Score Badge */}
                        <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                          interview.overallScore >= 80
                            ? 'bg-green-500/10 text-green-400'
                            : interview.overallScore >= 60
                            ? 'bg-yellow-500/10 text-yellow-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {interview.overallScore}%
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onStartDynamic={() => onStartRealtimeInterview('standard')}
        onStartFocused={(type) => onStartRealtimeInterview('focused', type)}
        onViewInterview={onViewInterviewResults}
        recentInterviews={interviewHistory}
      />
    </div>
  );
};

export default PlatformDashboard;
