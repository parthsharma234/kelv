import { InterviewHistory } from '../types/interview';

export interface Recommendation {
  id: string;
  type: 'practice' | 'improvement' | 'challenge' | 'milestone';
  title: string;
  description: string;
  action: {
    type: 'start-interview';
    interviewType: 'standard' | 'focused';
    focusedType?: string;
  };
  priority: number; // 1-5, 5 being highest
  icon: string;
  color: string;
  gradient: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number; // 0-100
  requirement: number;
  category: 'interviews' | 'scores' | 'streaks' | 'practice' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  gradient: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastInterviewDate: Date | null;
  interviewDates: Date[];
  streakCalendar: { date: Date; hasInterview: boolean }[];
}

// Calculate real streak from interview history
export function calculateStreak(history: InterviewHistory[]): StreakData {
  if (history.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastInterviewDate: null,
      interviewDates: [],
      streakCalendar: generateCalendar([])
    };
  }

  // Sort interviews by date (most recent first)
  const sortedHistory = [...history].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Get unique dates (ignore time)
  const uniqueDates = Array.from(new Set(
    sortedHistory.map(i => new Date(i.date).toDateString())
  )).map(d => new Date(d));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Calculate current streak (working backwards from today)
  const lastInterviewDate = uniqueDates[0];
  const daysSinceLastInterview = Math.floor(
    (today.getTime() - lastInterviewDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Streak breaks if no interview today or yesterday
  if (daysSinceLastInterview <= 1) {
    let checkDate = new Date(today);

    for (let i = 0; i < uniqueDates.length; i++) {
      const interviewDate = new Date(uniqueDates[i]);
      const dayDiff = Math.floor(
        (checkDate.getTime() - interviewDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff <= 1) {
        currentStreak++;
        checkDate = new Date(interviewDate);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  for (let i = 0; i < uniqueDates.length; i++) {
    tempStreak = 1;

    for (let j = i + 1; j < uniqueDates.length; j++) {
      const dayDiff = Math.floor(
        (uniqueDates[j - 1].getTime() - uniqueDates[j].getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff <= 1) {
        tempStreak++;
      } else {
        break;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return {
    currentStreak,
    longestStreak,
    lastInterviewDate,
    interviewDates: uniqueDates,
    streakCalendar: generateCalendar(uniqueDates)
  };
}

// Generate last 30 days calendar
function generateCalendar(interviewDates: Date[]): { date: Date; hasInterview: boolean }[] {
  const calendar = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const interviewDateStrings = interviewDates.map(d => d.toDateString());

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    calendar.push({
      date,
      hasInterview: interviewDateStrings.includes(date.toDateString())
    });
  }

  return calendar;
}

// Generate personalized recommendations
export function generateRecommendations(
  history: InterviewHistory[],
  strengthsAndWeaknesses: { strengths: string[]; weaknesses: string[] }
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // If no interviews, recommend starting
  if (history.length === 0) {
    recommendations.push({
      id: 'first-interview',
      type: 'milestone',
      title: 'Start Your First Interview',
      description: 'Begin your journey with a 20-minute dynamic interview',
      action: { type: 'start-interview', interviewType: 'standard' },
      priority: 5,
      icon: '🚀',
      color: 'orange',
      gradient: 'from-orange-500 to-red-500'
    });
    return recommendations;
  }

  // Analyze recent performance
  const recentInterviews = history.slice(0, 5);
  const avgRecentScore = recentInterviews.reduce((sum, i) => sum + i.overallScore, 0) / recentInterviews.length;

  // Check which types haven't been practiced
  const practiceTypes = ['technical', 'behavioral', 'situational', 'leadership', 'problemSolving', 'communication'];
  const practicedTypes = new Set(history.map(i => i.interviewType).filter(Boolean));
  const unpracticedTypes = practiceTypes.filter(t => !practicedTypes.has(t));

  // Recommendation 1: Unpracticed areas
  if (unpracticedTypes.length > 0) {
    const type = unpracticedTypes[0];
    recommendations.push({
      id: `try-${type}`,
      type: 'practice',
      title: `Try ${formatTypeName(type)} Practice`,
      description: 'Expand your skillset with a new interview type',
      action: { type: 'start-interview', interviewType: 'focused', focusedType: type },
      priority: 4,
      icon: getTypeIcon(type),
      color: getTypeColor(type),
      gradient: getTypeGradient(type)
    });
  }

  // Recommendation 2: Weaknesses to improve
  if (strengthsAndWeaknesses.weaknesses.length > 0) {
    const weakness = strengthsAndWeaknesses.weaknesses[0];
    const suggestedType = mapWeaknessToType(weakness);

    recommendations.push({
      id: 'improve-weakness',
      type: 'improvement',
      title: 'Strengthen Your Weak Spots',
      description: `Focus on: ${weakness}`,
      action: { type: 'start-interview', interviewType: 'focused', focusedType: suggestedType },
      priority: 5,
      icon: '🎯',
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500'
    });
  }

  // Recommendation 3: Challenge yourself if doing well
  if (avgRecentScore >= 75) {
    recommendations.push({
      id: 'challenge',
      type: 'challenge',
      title: 'Take on a Challenge',
      description: 'You\'re doing great! Try a full dynamic interview',
      action: { type: 'start-interview', interviewType: 'standard' },
      priority: 3,
      icon: '💪',
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500'
    });
  }

  // Recommendation 4: Practice most improved area
  const mostImprovedType = findMostImprovedType(history);
  if (mostImprovedType) {
    recommendations.push({
      id: 'build-momentum',
      type: 'practice',
      title: 'Build on Your Momentum',
      description: `Keep improving your ${formatTypeName(mostImprovedType)} skills`,
      action: { type: 'start-interview', interviewType: 'focused', focusedType: mostImprovedType },
      priority: 3,
      icon: '📈',
      color: 'green',
      gradient: 'from-green-500 to-emerald-500'
    });
  }

  // Sort by priority
  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 3);
}

// Generate achievements
export function calculateAchievements(
  history: InterviewHistory[],
  streakData: StreakData
): Achievement[] {
  const achievements: Achievement[] = [
    // Interview count achievements
    {
      id: 'first-steps',
      title: 'First Steps',
      description: 'Complete your first interview',
      icon: '🎯',
      unlocked: history.length >= 1,
      unlockedAt: history.length >= 1 ? new Date(history[history.length - 1].date) : undefined,
      progress: Math.min(100, (history.length / 1) * 100),
      requirement: 1,
      category: 'interviews',
      rarity: 'common',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Complete 5 interviews',
      icon: '🚀',
      unlocked: history.length >= 5,
      unlockedAt: history.length >= 5 ? new Date(history[4].date) : undefined,
      progress: Math.min(100, (history.length / 5) * 100),
      requirement: 5,
      category: 'interviews',
      rarity: 'common',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      id: 'dedicated',
      title: 'Dedicated Learner',
      description: 'Complete 10 interviews',
      icon: '📚',
      unlocked: history.length >= 10,
      unlockedAt: history.length >= 10 ? new Date(history[9].date) : undefined,
      progress: Math.min(100, (history.length / 10) * 100),
      requirement: 10,
      category: 'interviews',
      rarity: 'rare',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'interview-master',
      title: 'Interview Master',
      description: 'Complete 25 interviews',
      icon: '👑',
      unlocked: history.length >= 25,
      unlockedAt: history.length >= 25 ? new Date(history[24].date) : undefined,
      progress: Math.min(100, (history.length / 25) * 100),
      requirement: 25,
      category: 'interviews',
      rarity: 'epic',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'legend',
      title: 'Legend',
      description: 'Complete 50 interviews',
      icon: '🏆',
      unlocked: history.length >= 50,
      unlockedAt: history.length >= 50 ? new Date(history[49].date) : undefined,
      progress: Math.min(100, (history.length / 50) * 100),
      requirement: 50,
      category: 'interviews',
      rarity: 'legendary',
      gradient: 'from-orange-500 via-red-500 to-pink-500'
    },

    // Score achievements
    {
      id: 'first-success',
      title: 'First Success',
      description: 'Score 80% or higher',
      icon: '⭐',
      unlocked: history.some(i => i.overallScore >= 80),
      unlockedAt: history.find(i => i.overallScore >= 80) ? new Date(history.find(i => i.overallScore >= 80)!.date) : undefined,
      progress: history.length > 0 ? Math.min(100, (Math.max(...history.map(i => i.overallScore)) / 80) * 100) : 0,
      requirement: 80,
      category: 'scores',
      rarity: 'common',
      gradient: 'from-yellow-500 to-amber-500'
    },
    {
      id: 'perfectionist',
      title: 'Perfectionist',
      description: 'Score 95% or higher',
      icon: '💎',
      unlocked: history.some(i => i.overallScore >= 95),
      unlockedAt: history.find(i => i.overallScore >= 95) ? new Date(history.find(i => i.overallScore >= 95)!.date) : undefined,
      progress: history.length > 0 ? Math.min(100, (Math.max(...history.map(i => i.overallScore)) / 95) * 100) : 0,
      requirement: 95,
      category: 'scores',
      rarity: 'legendary',
      gradient: 'from-cyan-500 via-blue-500 to-purple-500'
    },

    // Streak achievements
    {
      id: 'on-fire',
      title: 'On Fire',
      description: 'Maintain a 3-day streak',
      icon: '🔥',
      unlocked: streakData.currentStreak >= 3 || streakData.longestStreak >= 3,
      unlockedAt: streakData.currentStreak >= 3 ? new Date() : undefined,
      progress: Math.min(100, (streakData.currentStreak / 3) * 100),
      requirement: 3,
      category: 'streaks',
      rarity: 'common',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      id: 'unstoppable',
      title: 'Unstoppable',
      description: 'Maintain a 7-day streak',
      icon: '🌟',
      unlocked: streakData.currentStreak >= 7 || streakData.longestStreak >= 7,
      unlockedAt: streakData.currentStreak >= 7 ? new Date() : undefined,
      progress: Math.min(100, (streakData.currentStreak / 7) * 100),
      requirement: 7,
      category: 'streaks',
      rarity: 'rare',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'dedication-personified',
      title: 'Dedication Personified',
      description: 'Maintain a 30-day streak',
      icon: '🏅',
      unlocked: streakData.currentStreak >= 30 || streakData.longestStreak >= 30,
      unlockedAt: streakData.currentStreak >= 30 ? new Date() : undefined,
      progress: Math.min(100, (streakData.currentStreak / 30) * 100),
      requirement: 30,
      category: 'streaks',
      rarity: 'legendary',
      gradient: 'from-yellow-500 via-orange-500 to-red-500'
    },

    // Practice diversity
    {
      id: 'well-rounded',
      title: 'Well-Rounded',
      description: 'Complete all 6 focused interview types',
      icon: '🎨',
      unlocked: new Set(history.map(i => i.interviewType).filter(Boolean)).size >= 6,
      unlockedAt: undefined,
      progress: Math.min(100, (new Set(history.map(i => i.interviewType).filter(Boolean)).size / 6) * 100),
      requirement: 6,
      category: 'practice',
      rarity: 'epic',
      gradient: 'from-indigo-500 to-purple-500'
    }
  ];

  return achievements;
}

// Helper functions
function formatTypeName(type: string): string {
  const names: Record<string, string> = {
    technical: 'Technical',
    behavioral: 'Behavioral',
    situational: 'Situational',
    leadership: 'Leadership',
    problemSolving: 'Problem Solving',
    communication: 'Communication'
  };
  return names[type] || type;
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    technical: '💻',
    behavioral: '🎯',
    situational: '🧩',
    leadership: '👑',
    problemSolving: '🧠',
    communication: '💬'
  };
  return icons[type] || '📝';
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    technical: 'blue',
    behavioral: 'purple',
    situational: 'orange',
    leadership: 'emerald',
    problemSolving: 'indigo',
    communication: 'rose'
  };
  return colors[type] || 'gray';
}

function getTypeGradient(type: string): string {
  const gradients: Record<string, string> = {
    technical: 'from-blue-500 to-cyan-500',
    behavioral: 'from-purple-500 to-pink-500',
    situational: 'from-amber-500 to-red-500',
    leadership: 'from-emerald-500 to-teal-500',
    problemSolving: 'from-indigo-500 to-purple-500',
    communication: 'from-rose-500 to-pink-500'
  };
  return gradients[type] || 'from-gray-500 to-gray-700';
}

function mapWeaknessToType(weakness: string): string {
  const lower = weakness.toLowerCase();
  if (lower.includes('technical') || lower.includes('coding')) return 'technical';
  if (lower.includes('behavior') || lower.includes('star')) return 'behavioral';
  if (lower.includes('situation') || lower.includes('scenario')) return 'situational';
  if (lower.includes('leadership') || lower.includes('team')) return 'leadership';
  if (lower.includes('problem') || lower.includes('solving')) return 'problemSolving';
  if (lower.includes('communication') || lower.includes('explain')) return 'communication';
  return 'behavioral'; // Default
}

function findMostImprovedType(history: InterviewHistory[]): string | null {
  if (history.length < 3) return null;

  const typeScores: Record<string, number[]> = {};

  history.forEach(interview => {
    const type = interview.interviewType || 'dynamic';
    if (!typeScores[type]) typeScores[type] = [];
    typeScores[type].push(interview.overallScore);
  });

  let maxImprovement = 0;
  let mostImprovedType: string | null = null;

  Object.entries(typeScores).forEach(([type, scores]) => {
    if (scores.length >= 2) {
      const recent = scores.slice(0, Math.min(3, scores.length));
      const older = scores.slice(Math.min(3, scores.length));

      if (older.length > 0) {
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        const improvement = recentAvg - olderAvg;

        if (improvement > maxImprovement) {
          maxImprovement = improvement;
          mostImprovedType = type;
        }
      }
    }
  });

  return mostImprovedType;
}
