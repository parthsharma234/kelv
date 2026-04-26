import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Target,
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
  const nextRecommendation = recommendations[0];
  const nextWeakPoint = weaknesses[0] || nextRecommendation?.title || 'Run one session to surface your first target';
  const recentWin = strengths[0] || 'No stable strength pattern yet';

  const heroStats = [
    { label: 'Sessions logged', value: stats.totalInterviews, helper: 'All time' },
    { label: 'Avg score', value: stats.averageScore ? stats.averageScore.toFixed(1) : '--', helper: 'Across saved mocks' },
    { label: 'Hours coached', value: `${stats.totalHours.toFixed(1)}h`, helper: 'Live runtime' }
  ];

  const emptyState = (
    <div className="rounded-lg p-8 text-center" style={{ border: '1px solid var(--border)' }}>
      <p className="text-gray-400">No interviews logged yet. Kick off your first session to start tracking progress.</p>
      <button
        onClick={() => onStartRealtimeInterview('standard')}
        className="mt-6 inline-flex items-center gap-2 px-6 py-3.5 rounded-sm bg-orange-500 text-white text-sm font-medium tracking-wide shadow-[0_0_24px_rgba(232,101,26,0.25)] hover:bg-orange-400 transition-all duration-200"
      >
        Start now
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen text-white pt-24" style={{ background: 'var(--bg)' }}>
      <section className="relative overflow-hidden" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at top, rgba(232,101,26,0.07) 0%, transparent 60%)' }} />

        <div className="relative px-6 lg:px-12 py-14 max-w-[1500px] mx-auto grid gap-12 lg:grid-cols-[1.35fr,0.65fr] items-start">
          <div>
            <p className="text-[10px] uppercase tracking-[0.08em] mb-4" style={{ color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>
              Kelv · Control Room
            </p>
            <h1 className="text-4xl font-medium mt-0 mb-3 leading-[1.1] md:text-5xl" style={{ color: 'var(--text)', letterSpacing: '-0.022em' }}>
              Train the weak point,
              <br />
              not just the schedule.
            </h1>
            <p className="text-base max-w-xl" style={{ color: 'var(--text-3)' }}>
              Kelv tells you what slipped, what held up, and what rep matters next.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={() => onStartRealtimeInterview('standard')}
                className="px-7 py-3.5 rounded-sm bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium tracking-wide shadow-[0_0_24px_rgba(232,101,26,0.25)] hover:shadow-[0_0_36px_rgba(232,101,26,0.4)] transition-all duration-200 inline-flex items-center gap-2"
              >
                Start live interview
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-10 grid sm:grid-cols-3 gap-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-lg bg-white/[0.03] p-4" style={{ border: "1px solid var(--border)" }}>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">{stat.label}</p>
                  <p className="font-mono text-3xl font-medium mt-3 text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.helper}</p>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full rounded-lg p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm uppercase tracking-[0.3em] text-gray-400">Practice target</p>
            {latestSession ? (
              <>
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-xs text-gray-500">{new Date(latestSession.date).toLocaleDateString()}</p>
                    <p className="text-xl font-semibold mt-1">{nextWeakPoint}</p>
                    <p className="text-sm text-gray-400 mt-2 max-w-sm">
                      {nextRecommendation?.description || 'Revisit the last session and turn the lowest-signal answer into your next deliberate rep.'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-semibold">{latestSession.overallScore?.toFixed(1) || '--'}</p>
                    <p className="text-xs text-gray-500">last score</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/[0.03] p-4" style={{ border: "1px solid var(--border)" }}>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-gray-500">Last interview trend</p>
                    <p className="text-lg font-semibold mt-2">{formatInterviewType(latestSession.interviewType)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {latestSession.setup.jobType} · {latestSession.setup.industry}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] p-4" style={{ border: "1px solid var(--border)" }}>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-gray-500">Recent win</p>
                    <p className="text-lg font-semibold mt-2">{recentWin}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Preserve this while tightening the next weakness.
                    </p>
                  </div>
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
                <p className="text-gray-400 text-sm">We’ll pin your next weak point here once you run your first saved session.</p>
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
          <div className="rounded-lg p-6 bg-white/[0.03]" style={{ border: "1px solid var(--border)" }} className2="">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em]">Live timeline</p>
                <h3 className="text-base font-medium text-white mt-1">Recent sessions</h3>
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
                    className="w-full text-left border rounded-lg p-4 hover:border-orange-500/40 transition bg-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{new Date(session.date).toLocaleDateString()}</p>
                        <p className="text-lg font-semibold">{formatInterviewType(session.interviewType)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-2xl font-medium text-white">{session.overallScore?.toFixed(1) || '--'}</p>
                        <p className="text-sm text-gray-500">score</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-400">
                      <span className="px-3 py-1 rounded-sm border bg-white/[0.03]">{session.questionsAnswered} Qs</span>
                      <span className="px-3 py-1 rounded-sm border bg-white/[0.03]">{Math.round(session.duration / 60)} min</span>
                      <span className="px-3 py-1 rounded-sm border bg-white/[0.03]">{session.setup.industry}</span>
                    </div>
                  </motion.button>
                ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg p-6 bg-white/[0.03]" style={{ border: "1px solid var(--border)" }} className2="">
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em]">Streak</p>
              <h3 className="font-mono text-3xl font-medium mt-3 text-white">{streakData.currentStreak} days</h3>
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

            <div className="rounded-lg p-6 bg-white/[0.03]" style={{ border: "1px solid var(--border)" }} className2="">
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em]">Signal scan</p>
              <div className="mt-4 grid grid-cols-1 gap-4">
                <div>
                  <p className="text-xs text-gray-500">What landed well</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {strengths.length === 0 && <span className="text-gray-500 text-sm">No data yet</span>}
                    {strengths.map((strength) => (
                      <span key={strength} className="px-3 py-1 rounded-sm border border-green-500/20 text-green-300 text-xs">
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
                      <span key={weakness} className="px-3 py-1 rounded-sm border border-red-500/20 text-red-300 text-xs">
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
                <h3 className="text-base font-medium text-white mt-1">Dial in one behaviour at a time</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {focusedModes.map((mode, idx) => (
                <div
                  key={mode.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    transition: 'border-color 0.15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.08em' }}>0{idx + 1}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>{mode.duration}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>{mode.label}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: '1.55' }}>{mode.copy}</p>
                  </div>
                  <button
                    onClick={() => onStartRealtimeInterview('focused', mode.id)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--orange)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 'auto' }}
                  >
                    Run drill
                    <ArrowRight style={{ width: '12px', height: '12px' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Practice cadence</p>
            {interviewHistory.length > 0 ? (
              <div className="space-y-4">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'This week', value: interviewHistory.filter(i => {
                        const d = new Date(i.date);
                        const now = new Date();
                        return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
                      }).length.toString(), unit: 'sessions' },
                    { label: 'Best score', value: Math.max(...interviewHistory.map(i => i.overallScore)).toFixed(0), unit: 'pts' }
                  ].map(stat => (
                    <div key={stat.label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '5px', padding: '12px 14px' }}>
                      <p style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{stat.label}</p>
                      <p style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>{stat.value} <span style={{ fontSize: '11px', color: 'var(--text-4)', fontWeight: 400 }}>{stat.unit}</span></p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-4)', lineHeight: '1.6' }}>
                  {interviewHistory.length < 3
                    ? 'Run at least 3 sessions to see your trend line. Kelv needs reps to surface the real gaps.'
                    : `${interviewHistory.length} sessions logged. Keep a 3× weekly minimum until your avg clears 80.`}
                </p>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-4)', lineHeight: '1.6' }}>
                Your cadence shows here once you start logging sessions. Aim for 3× per week minimum — that's the rep count that moves your score.
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Next reps from Kelv</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
              {recommendations.slice(0, 4).map((rec, idx) => (
                <div key={rec.title} style={{ background: 'var(--surface-2)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', paddingTop: '2px', flexShrink: 0 }}>0{idx + 1}</span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>{rec.title}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>{rec.impact}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onStartRealtimeInterview(rec.action.interviewType, rec.action.focusedType)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--orange)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                  >
                    Run
                    <ArrowRight style={{ width: '11px', height: '11px' }} />
                  </button>
                </div>
              ))}
              {recommendations.length === 0 && (
                <div style={{ background: 'var(--surface-2)', padding: '16px', fontSize: '13px', color: 'var(--text-4)' }}>Kelv will surface recommendations after your first interview.</div>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '24px' }}>
            <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>Milestones</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
              {achievements.slice(0, 5).map((achievement, idx) => (
                <div key={achievement.id} style={{ background: 'var(--surface-2)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', opacity: achievement.unlocked ? 1 : 0.45 }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', flexShrink: 0, width: '18px' }}>0{idx + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '1px' }}>{achievement.title}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-4)' }}>{achievement.description}</p>
                  </div>
                  {!achievement.unlocked && (
                    <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', flexShrink: 0 }}>{Math.round(achievement.progress)}%</span>
                  )}
                  {achievement.unlocked && (
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(74,222,128,0.7)', flexShrink: 0 }} />
                  )}
                </div>
              ))}
              {achievements.length === 0 && (
                <div style={{ background: 'var(--surface-2)', padding: '16px', fontSize: '13px', color: 'var(--text-4)' }}>Stay consistent and Kelv will unlock your first milestone.</div>
              )}
            </div>
          </div>
        </section>
      </div>

    </div>
  );
};

export default PlatformDashboard;
