import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { InterviewSession, InterviewHistory } from '../types/interview';

export const saveInterviewSession = async (sessionData: any): Promise<void> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, skipping save');
    return;
  }

  try {
    const { error } = await supabase
      .from('interview_sessions')
      .insert({
        setup: sessionData.setup,
        responses: sessionData.responses,
        overall_score: sessionData.overallScore,
        duration: sessionData.duration,
        questions_answered: sessionData.responses.length,
        status: 'completed'
      });

    if (error) {
      console.error('Error saving interview session:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to save interview session:', error);
    // Don't throw error to prevent blocking user flow
  }
};

export const getInterviewHistory = async (): Promise<InterviewHistory[]> => {
  if (!isSupabaseConfigured()) {
    // Return localStorage data as fallback
    const localHistory = localStorage.getItem('kelv-interview-history');
    return localHistory ? JSON.parse(localHistory) : [];
  }

  try {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching interview history:', error);
      // Fallback to localStorage
      const localHistory = localStorage.getItem('kelv-interview-history');
      return localHistory ? JSON.parse(localHistory) : [];
    }

    // Transform Supabase data to InterviewHistory format
    return data.map(session => ({
      id: session.id,
      date: new Date(session.created_at),
      setup: session.setup,
      overallScore: session.overall_score,
      duration: session.duration,
      questionsAnswered: session.questions_answered,
      status: session.status as 'completed' | 'incomplete'
    }));

  } catch (error) {
    console.error('Failed to fetch interview history:', error);
    // Fallback to localStorage
    const localHistory = localStorage.getItem('kelv-interview-history');
    return localHistory ? JSON.parse(localHistory) : [];
  }
};

export const getInterviewStats = async () => {
  if (!isSupabaseConfigured()) {
    // Calculate from localStorage
    const localHistory = localStorage.getItem('kelv-interview-history');
    const history = localHistory ? JSON.parse(localHistory) : [];
    
    const totalInterviews = history.length;
    const averageScore = history.reduce((sum: number, interview: any) => sum + interview.overallScore, 0) / totalInterviews || 0;
    const totalHours = history.reduce((sum: number, interview: any) => sum + interview.duration, 0) / 3600;
    
    let improvement = 0;
    if (totalInterviews >= 6) {
      const recent = history.slice(-3).reduce((sum: number, interview: any) => sum + interview.overallScore, 0) / 3;
      const initial = history.slice(0, 3).reduce((sum: number, interview: any) => sum + interview.overallScore, 0) / 3;
      improvement = ((recent - initial) / initial) * 100;
    }
    
    return {
      totalInterviews,
      averageScore: Math.round(averageScore),
      totalHours: Math.round(totalHours * 10) / 10,
      improvement: Math.round(improvement)
    };
  }

  try {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('overall_score, duration, created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching interview stats:', error);
      return { totalInterviews: 0, averageScore: 0, totalHours: 0, improvement: 0 };
    }

    const totalInterviews = data.length;
    const averageScore = data.reduce((sum, session) => sum + session.overall_score, 0) / totalInterviews || 0;
    const totalHours = data.reduce((sum, session) => sum + session.duration, 0) / 3600;
    
    let improvement = 0;
    if (totalInterviews >= 6) {
      const recent = data.slice(-3).reduce((sum, session) => sum + session.overall_score, 0) / 3;
      const initial = data.slice(0, 3).reduce((sum, session) => sum + session.overall_score, 0) / 3;
      improvement = ((recent - initial) / initial) * 100;
    }
    
    return {
      totalInterviews,
      averageScore: Math.round(averageScore),
      totalHours: Math.round(totalHours * 10) / 10,
      improvement: Math.round(improvement)
    };

  } catch (error) {
    console.error('Failed to fetch interview stats:', error);
    return { totalInterviews: 0, averageScore: 0, totalHours: 0, improvement: 0 };
  }
};