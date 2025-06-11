import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { InterviewSession, InterviewHistory, InterviewSetup } from '../types/interview';

export interface SavedInterviewSetup {
  id: string;
  name: string;
  setup: InterviewSetup;
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export const saveInterviewSession = async (sessionData: any): Promise<void> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, skipping save');
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('interview_sessions')
      .insert({
        user_id: user.id,
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

export const saveInterviewSetup = async (
  name: string, 
  setup: InterviewSetup, 
  isFavorite: boolean = false
): Promise<SavedInterviewSetup | null> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, skipping setup save');
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('interview_setups')
      .insert({
        user_id: user.id,
        name,
        setup,
        is_favorite: isFavorite,
        usage_count: 1
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving interview setup:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to save interview setup:', error);
    return null;
  }
};

export const getUserInterviewSetups = async (): Promise<SavedInterviewSetup[]> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, returning empty setups');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('interview_setups')
      .select('*')
      .order('is_favorite', { ascending: false })
      .order('usage_count', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching interview setups:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch interview setups:', error);
    return [];
  }
};

export const updateSetupUsage = async (setupId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    // First get the current usage count
    const { data: currentData, error: fetchError } = await supabase
      .from('interview_setups')
      .select('usage_count')
      .eq('id', setupId)
      .single();

    if (fetchError) {
      console.error('Error fetching current usage count:', fetchError);
      return;
    }

    // Then update with incremented value
    const { error } = await supabase
      .from('interview_setups')
      .update({ 
        usage_count: (currentData.usage_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', setupId);

    if (error) {
      console.error('Error updating setup usage:', error);
    }
  } catch (error) {
    console.error('Failed to update setup usage:', error);
  }
};

export const toggleSetupFavorite = async (setupId: string, isFavorite: boolean): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const { error } = await supabase
      .from('interview_setups')
      .update({ 
        is_favorite: isFavorite,
        updated_at: new Date().toISOString()
      })
      .eq('id', setupId);

    if (error) {
      console.error('Error toggling setup favorite:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to toggle setup favorite:', error);
  }
};

export const deleteInterviewSetup = async (setupId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const { error } = await supabase
      .from('interview_setups')
      .delete()
      .eq('id', setupId);

    if (error) {
      console.error('Error deleting interview setup:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete interview setup:', error);
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