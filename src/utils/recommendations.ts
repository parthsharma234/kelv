import { InterviewHistory } from '../types/interview';

export interface Recommendation {
  id: string;
  type: 'practice' | 'improvement' | 'challenge' | 'milestone';
  category: string;
  title: string;
  description: string;
  action: {
    type: 'start-interview';
    interviewType: 'standard' | 'focused';
    focusedType?: string;
  };
  priority: number;
  impact: string;
  color: string;
  gradient: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number;
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
  streakCalendar: { date: Date; hasInterview: boolean; completed: boolean }[];
}

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

  const sortedHistory = [...history].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const uniqueDates = Array.from(new Set(
    sortedHistory.map(i => new Date(i.date).toDateString())
  )).map(d => new Date(d));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const lastInterviewDate = uniqueDates[0];
  const daysSinceLastInterview = Math.floor(
    (today.getTime() - lastInterviewDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastInterview <= 1) {
    let checkDate = new Date(today);

    for (let i = 0; i < uniqueDates.length; i++) {
      const interviewDate = new Date(uniqueDates[i]);
      interviewDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (checkDate.getTime() - interviewDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= 1) {
        currentStreak++;
        checkDate = interviewDate;
      } else {
        break;
      }
    }
  }

  tempStreak = 0;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = uniqueDates[i];
    const next = uniqueDates[i + 1];
    const daysDiff = Math.floor(
      (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
    );

    tempStreak++;
    if (daysDiff > 1) {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 0;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak + 1, currentStreak);

  return {
    currentStreak,
    longestStreak,
    lastInterviewDate: lastInterviewDate,
    interviewDates: uniqueDates,
    streakCalendar: generateCalendar(uniqueDates)
  };
}

function generateCalendar(interviewDates: Date[]): { date: Date; hasInterview: boolean; completed: boolean }[] {
  const calendar = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const interviewDateStrings = new Set(interviewDates.map(d => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date.toDateString();
  }));

  for (let i = 27; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const hasInterview = interviewDateStrings.has(date.toDateString());
    calendar.push({ date, hasInterview, completed: hasInterview });
  }

  return calendar;
}

export function generateRecommendations(
  history: InterviewHistory[],
  strengthsAndWeaknesses: { strengths: string[]; weaknesses: string[] }
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (history.length === 0) {
    recommendations.push({
      id: 'first-interview',
      type: 'milestone',
      category: 'First session',
      title: 'Run your first session',
      description: 'Start the loop. One session gives Kelv enough signal to surface your first weak point.',
      action: { type: 'start-interview', interviewType: 'standard' },
      priority: 5,
      impact: 'Unlocks all tracking',
      color: 'orange',
      gradient: 'from-orange-500 to-red-500'
    });
    return recommendations;
  }

  const recentInterviews = history.slice(0, 5);
  const avgRecentScore = recentInterviews.reduce((sum, i) => sum + i.overallScore, 0) / recentInterviews.length;

  const practiceTypes = ['technical', 'behavioral', 'situational', 'leadership', 'problemSolving', 'communication'];
  const practicedTypes = new Set(history.map(i => i.interviewType).filter(Boolean));
  const unpracticedTypes = practiceTypes.filter(t => !practicedTypes.has(t));

  if (unpracticedTypes.length > 0) {
    const type = unpracticedTypes[0];
    recommendations.push({
      id: `try-${type}`,
      type: 'practice',
      category: formatTypeName(type),
      title: `Untested: ${formatTypeName(type)}`,
      description: `You haven't run a ${formatTypeName(type).toLowerCase()} drill yet. Gaps you haven't seen are the ones that cost offers.`,
      action: { type: 'start-interview', interviewType: 'focused', focusedType: type },
      priority: 4,
      impact: 'Exposes unknown gap',
      color: getTypeColor(type),
      gradient: getTypeGradient(type)
    });
  }

  if (strengthsAndWeaknesses.weaknesses.length > 0) {
    const weakness = strengthsAndWeaknesses.weaknesses[0];
    const suggestedType = mapWeaknessToType(weakness);

    recommendations.push({
      id: 'improve-weakness',
      type: 'improvement',
      category: 'Proof gap',
      title: `Weak point: ${weakness}`,
      description: `This is your most consistent gap. Drill it directly until the score moves.`,
      action: { type: 'start-interview', interviewType: 'focused', focusedType: suggestedType },
      priority: 5,
      impact: 'Highest score leverage',
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500'
    });
  }

  if (avgRecentScore >= 75) {
    recommendations.push({
      id: 'challenge',
      type: 'challenge',
      category: 'Full pressure',
      title: 'Full dynamic — no safety net',
      description: `You're averaging ${Math.round(avgRecentScore)}. A full session under pressure is where the remaining gaps show.`,
      action: { type: 'start-interview', interviewType: 'standard' },
      priority: 3,
      impact: 'Tests ceiling under pressure',
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500'
    });
  }

  const mostImprovedType = findMostImprovedType(history);
  if (mostImprovedType) {
    recommendations.push({
      id: 'build-momentum',
      type: 'practice',
      category: formatTypeName(mostImprovedType),
      title: `Press your best area: ${formatTypeName(mostImprovedType)}`,
      description: `This is your most improved format. Keep the reps coming while the pattern is live.`,
      action: { type: 'start-interview', interviewType: 'focused', focusedType: mostImprovedType },
      priority: 3,
      impact: 'Consolidate improvement',
      color: 'green',
      gradient: 'from-green-500 to-emerald-500'
    });
  }

  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 3);
}

export function calculateAchievements(
  history: InterviewHistory[],
  streakData: StreakData
): Achievement[] {
  const achievements: Achievement[] = [
    {
      id: 'first-steps',
      title: 'First Rep',
      description: 'Complete your first interview',
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
      title: '5 Sessions',
      description: 'Complete 5 interviews',
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
      title: '10 Sessions',
      description: 'Complete 10 interviews',
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
      title: '25 Sessions',
      description: 'Complete 25 interviews',
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
      title: '50 Sessions',
      description: 'Complete 50 interviews',
      unlocked: history.length >= 50,
      unlockedAt: history.length >= 50 ? new Date(history[49].date) : undefined,
      progress: Math.min(100, (history.length / 50) * 100),
      requirement: 50,
      category: 'interviews',
      rarity: 'legendary',
      gradient: 'from-orange-500 via-red-500 to-pink-500'
    },
    {
      id: 'first-success',
      title: 'Broke 80',
      description: 'Score 80% or higher',
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
      title: 'Broke 95',
      description: 'Score 95% or higher',
      unlocked: history.some(i => i.overallScore >= 95),
      unlockedAt: history.find(i => i.overallScore >= 95) ? new Date(history.find(i => i.overallScore >= 95)!.date) : undefined,
      progress: history.length > 0 ? Math.min(100, (Math.max(...history.map(i => i.overallScore)) / 95) * 100) : 0,
      requirement: 95,
      category: 'scores',
      rarity: 'legendary',
      gradient: 'from-cyan-500 via-blue-500 to-purple-500'
    },
    {
      id: 'on-fire',
      title: '3-Day Run',
      description: 'Maintain a 3-day streak',
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
      title: '7-Day Run',
      description: 'Maintain a 7-day streak',
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
      title: '30-Day Run',
      description: 'Maintain a 30-day streak',
      unlocked: streakData.currentStreak >= 30 || streakData.longestStreak >= 30,
      unlockedAt: streakData.currentStreak >= 30 ? new Date() : undefined,
      progress: Math.min(100, (streakData.currentStreak / 30) * 100),
      requirement: 30,
      category: 'streaks',
      rarity: 'legendary',
      gradient: 'from-yellow-500 via-orange-500 to-red-500'
    },
    {
      id: 'well-rounded',
      title: 'All Six Formats',
      description: 'Complete all 6 focused interview types',
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
  return 'behavioral';
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
