import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Target,
  Trophy,
  Award,
  Brain,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { InterviewHistory } from '../../types/interview';
import { getInterviewHistory, getInterviewStats, getUserStrengthsAndWeaknesses } from '../../utils/supabase-interview';
import { generateRecommendations, calculateAchievements, calculateStreak, Recommendation, Achievement, StreakData } from '../../utils/recommendations';

interface PlatformDashboardProps {
  onStartRealtimeInterview: (type: 'standard' | 'focused', focusedType?: string) => void;
  onViewInterviewResults: (id: string, interviewType?: string | null) => void;
}

const focusedModes = [
  {
    id: 'technical',
    label: 'Technical Deep-Dive',
    duration: '7 min',
    copy: 'Systems, algorithms, and whiteboard pressure with timed follow-ups.',
    icon: Brain,
    accent: 'from-orange-500 via-orange-400 to-amber-300'
  },
  {
    id: 'behavioral',
    label: 'Behavioral Storycraft',
    duration: '5 min',
    copy: 'STAR drills that stress receipts, conflict, and confident endings.',
    icon: MessageSquare,
    accent: 'from-purple-500 via-pink-500 to-rose-400'
  },
  {
    id: 'situational',
    label: 'Situational Judgement',
    duration: '4 min',
    copy: 'High-stakes "what if" prompts that test instincts and structure.',
    icon: ShieldCheck,
    accent: 'from-sky-500 via-blue-500 to-cyan-400'
  }
];

const formatInterviewType = (type?: string) => {
  if (!type) return 'Dynamic';
  return type
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

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
  const [strengthsAndWeaknesses, setStrengthsAndWeaknesses] = useState({ strengths: [] as string[], weaknesses: [] as string[] });
  const [isLoading, setIsLoading] = useState(true);
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

        const calculatedStreak = calculateStreak(history);
        setStreakData(calculatedStreak);
        setRecommendations(generateRecommendations(history, swData));
        setAchievements(calculateAchievements(history, calculatedStreak));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const primaryHistory = interviewHistory.slice(0, 4);
  const strengths = strengthsAndWeaknesses.strengths.slice(0, 3);
  const weaknesses = strengthsAndWeaknesses.weaknesses.slice(0, 3);
  const latestSession = interviewHistory[0];

  const heroStats = [
    { label: 'Sessions logged', value: stats.totalInterviews, helper: 'All time' },
    { label: 'Avg score', value: stats.averageScore ? stats.averageScore.toFixed(1) : '--', helper: 'Latest cohorts' },
    { label: 'Hours coached', value: `${stats.totalHours.toFixed(1)}h`, helper: 'Runtime' }
  ];

  const emptyState = (
    <div className="border border-white/10 rounded-2xl p-8 text-center">
      <p className="text-gray-400">No interviews logged yet. Kick off your first session to start tracking progress.</p>
      <button
        onClick={() => onStartRealtimeInterview('standard')}
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-500 text-white font-semibold shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition"
      >
        Start now
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030305] text-white pt-24">
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,115,55,0.18),transparent_65%)]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(120deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '180px 180px' }} />

        <div className="relative px-6 lg:px-12 py-14 max-w-[1500px] mx-auto grid gap-12 lg:grid-cols-[1.35fr,0.65fr] items-start">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-[0.32em] text-orange-300">
              Kelv Control Room
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold mt-5 mb-3 leading-tight">
              Launch drills, review receipts, and stay in rhythm.
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              This dashboard is wired to your live interviews. Start a mock, jump into a focus lab, or pull proof for your mentor - without leaving the page.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => onStartRealtimeInterview('standard')}
                className="px-7 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg shadow-orange-500/25 inline-flex items-center gap-2"
              >
                Start live interview
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-10 grid sm:grid-cols-3 gap-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-semibold mt-3">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.helper}</p>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg p-6 space-y-4"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-gray-400">Next session brief</p>
            {latestSession ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{new Date(latestSession.date).toLocaleDateString()}</p>
                    <p className="text-xl font-semibold mt-1">{formatInterviewType(latestSession.interviewType)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-semibold">{latestSession.overallScore?.toFixed(1) || '--'}</p>
                    <p className="text-xs text-gray-500">last score</p>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {latestSession.setup.jobType} · {latestSession.setup.industry}
                </div>
                <div className="text-xs text-gray-500 flex gap-3 flex-wrap">
                  <span>{latestSession.questionsAnswered} questions</span>
                  <span>·</span>
                  <span>{Math.round(latestSession.duration / 60)} min</span>
                </div>
                <button
                  onClick={() => onViewInterviewResults(latestSession.id, latestSession.interviewType)}
                  className="inline-flex items-center gap-2 text-sm text-orange-300 hover:text-white"
                >
                  View receipts
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-400 text-sm">We’ll pin your next interview here once you run your first session.</p>
                <button
                  onClick={() => onStartRealtimeInterview('standard')}
                  className="inline-flex items-center gap-2 text-sm text-orange-300 hover:text-white"
                >
                  Launch first interview
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </motion.div>
        </div>
      </section>

      <div className="max-w-[1500px] mx-auto px-6 lg:px-12 py-14 space-y-14">
        <section className="grid gap-8 lg:grid-cols-[1.25fr,0.75fr] items-start">
          <div className="border border-white/10 rounded-3xl p-6 bg-white/5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em]">Live timeline</p>
                <h3 className="text-2xl font-semibold mt-2">Latest sessions</h3>
              </div>
              <span className="text-xs text-gray-500">Auto-updates after every mock</span>
            </div>
            <div className="space-y-4">
              {isLoading && <div className="animate-pulse h-32 rounded-2xl bg-white/5" />}
              {!isLoading && primaryHistory.length === 0 && emptyState}
              {!isLoading &&
                primaryHistory.map((session) => (
                  <motion.button
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => onViewInterviewResults(session.id, session.interviewType)}
                    className="w-full text-left border border-white/10 rounded-2xl p-4 hover:border-orange-500/40 transition bg-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{new Date(session.date).toLocaleDateString()}</p>
                        <p className="text-lg font-semibold">{formatInterviewType(session.interviewType)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold">{session.overallScore?.toFixed(1) || '--'}</p>
                        <p className="text-sm text-gray-500">score</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-400">
                      <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5">{session.questionsAnswered} Qs</span>
                      <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5">{Math.round(session.duration / 60)} min</span>
                      <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5">{session.setup.industry}</span>
                    </div>
                  </motion.button>
                ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="border border-white/10 rounded-3xl p-6 bg-white/5">
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em]">Streak</p>
              <h3 className="text-3xl font-semibold mt-3">{streakData.currentStreak} days</h3>
              <p className="text-gray-400 text-sm">Longest streak: {streakData.longestStreak} days</p>
              <div className="flex items-center gap-4 mt-6">
                <div className="flex-1">
                  <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Last session</p>
                  <p className="text-lg font-semibold">{streakData.lastInterviewDate ? new Date(streakData.lastInterviewDate).toLocaleDateString() : '-'}</p>
                </div>
                <div className="text-xs grid grid-cols-7 gap-1">
                  {streakData.streakCalendar.slice(-14).map((day, idx) => (
                    <span
                      key={`${day.date}-${idx}`}
                      className={`w-3 h-3 rounded-sm ${day.completed ? 'bg-orange-400' : 'bg-white/10'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="border border-white/10 rounded-3xl p-6 bg-white/5">
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em]">Strength scan</p>
              <div className="mt-4 grid grid-cols-1 gap-4">
                <div>
                  <p className="text-xs text-gray-500">What landed well</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {strengths.length === 0 && <span className="text-gray-500 text-sm">No data yet</span>}
                    {strengths.map((strength) => (
                      <span key={strength} className="px-3 py-1 rounded-full border border-green-500/30 text-green-300 text-sm">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Needs polish</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {weaknesses.length === 0 && <span className="text-gray-500 text-sm">Kelv will highlight gaps after your first session.</span>}
                    {weaknesses.map((weakness) => (
                      <span key={weakness} className="px-3 py-1 rounded-full border border-red-500/30 text-red-300 text-sm">
                        {weakness}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] items-start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em]">Focused labs</p>
                <h3 className="text-2xl font-semibold mt-2">Dial in one behaviour at a time</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {focusedModes.map((mode) => (
                <motion.div
                  key={mode.id}
                  whileHover={{ translateY: -6 }}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5"
                >
                  <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${mode.accent}`} />
                  <div className="relative p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-black/30 text-white">
                        <mode.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-white/70">{mode.duration}</p>
                        <p className="text-lg font-semibold">{mode.label}</p>
                      </div>
                    </div>
                    <p className="text-sm text-white/80">{mode.copy}</p>
                    <button
                      onClick={() => onStartRealtimeInterview('focused', mode.id)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white"
                    >
                      Run this drill
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="border border-white/10 rounded-3xl p-6 bg-white/5 space-y-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em]">Velocity notes</p>
            <div className="space-y-3 text-sm text-gray-400">
              <p>Kelv tracks how often you're running mocks, which formats you lean on, and which interview types are still untouched.</p>
              <p>Use this card as your personal coach log - if you see gaps here, schedule the drill before the week ends.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="border border-white/10 rounded-3xl p-6 bg-white/5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-2xl font-semibold">Next reps from Kelv</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.slice(0, 4).map((rec) => (
                <div key={rec.title} className="p-4 rounded-2xl border border-white/10 bg-[#0f1117]">
                  <p className="text-sm text-orange-300 uppercase tracking-[0.3em]">{rec.category}</p>
                  <p className="text-lg font-semibold mt-2">{rec.title}</p>
                  <p className="text-sm text-gray-400 mt-1">{rec.description}</p>
                  <div className="mt-3 text-xs text-gray-500">Impact: {rec.impact}</div>
                </div>
              ))}
              {recommendations.length === 0 && <div className="text-gray-500 text-sm">Kelv will surface recommendations after your first interview.</div>}
            </div>
          </div>

          <div className="border border-white/10 rounded-3xl p-6 bg-white/5">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-5 h-5 text-orange-300" />
              <h3 className="text-xl font-semibold">Achievements</h3>
            </div>
            <div className="space-y-3">
              {achievements.slice(0, 4).map((achievement) => (
                <div key={achievement.id} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                    <Award className="w-4 h-4 text-orange-200" />
                  </div>
                  <div>
                    <p className="font-semibold">{achievement.title}</p>
                    <p className="text-sm text-gray-400">{achievement.description}</p>
                  </div>
                </div>
              ))}
              {achievements.length === 0 && <p className="text-sm text-gray-500">Stay consistent and Kelv will unlock your first badge.</p>}
            </div>
          </div>
        </section>
      </div>

    </div>
  );
};

export default PlatformDashboard;
