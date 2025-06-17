import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { InterviewSession, InterviewHistory, InterviewSetup, SpeechMetrics } from '../types/interview';

export interface SavedInterviewSetup {
  id: string;
  name: string;
  setup: InterviewSetup;
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export const createInitialInterviewSession = async (sessionId: string, setup: InterviewSetup): Promise<void> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, skipping initial session creation');
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
        id: sessionId,
        user_id: user.id,
        setup: setup,
        responses: [],
        overall_score: 0,
        duration: 0,
        questions_answered: 0,
        status: 'incomplete',
        speech_metrics: {},
        audio_data: {}
      });

    if (error) {
      console.error('Error creating initial interview session:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to create initial interview session:', error);
    throw error;
  }
};

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

    // Prepare speech metrics for storage
    const speechMetrics = sessionData.speechMetrics || {};
    const audioData = sessionData.audioData || {};

    // Update the existing session record instead of inserting
    const { error } = await supabase
      .from('interview_sessions')
      .update({
        responses: sessionData.responses,
        overall_score: sessionData.overallScore,
        duration: sessionData.duration,
        questions_answered: sessionData.responses.length,
        status: 'completed',
        speech_metrics: speechMetrics,
        audio_data: audioData
      })
      .eq('id', sessionData.id);

    if (error) {
      console.error('Error updating interview session:', error);
      throw error;
    }

    // Update user speech profile asynchronously
    try {
      await updateUserSpeechProfile(user.id);
    } catch (profileError) {
      console.warn('Failed to update speech profile:', profileError);
      // Don't throw error as session was saved successfully
    }
  } catch (error) {
    console.error('Failed to save interview session:', error);
    // Don't throw error to prevent blocking user flow
  }
};

export const saveSpeechAnalysisCache = async (
  sessionId: string,
  questionId: string,
  audioFeatures: any,
  speechPatterns: any
): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('speech_analysis_cache')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        question_id: questionId,
        audio_features: audioFeatures,
        speech_patterns: speechPatterns
      });

    if (error) {
      console.error('Error saving speech analysis cache:', error);
    }
  } catch (error) {
    console.error('Failed to save speech analysis cache:', error);
  }
};

export const getUserSpeechMetrics = async (): Promise<any> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .rpc('get_user_speech_metrics_average', { user_uuid: user.id });

    if (error) {
      console.error('Error fetching speech metrics:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch speech metrics:', error);
    return null;
  }
};

export const getSpeechImprovementTrends = async (daysBack: number = 30): Promise<any> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .rpc('get_speech_improvement_trends', { 
        user_uuid: user.id,
        days_back: daysBack 
      });

    if (error) {
      console.error('Error fetching speech improvement trends:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch speech improvement trends:', error);
    return null;
  }
};

export const updateUserSpeechProfile = async (userId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const { error } = await supabase
      .rpc('update_user_speech_profile', { user_uuid: userId });

    if (error) {
      console.error('Error updating speech profile:', error);
    }
  } catch (error) {
    console.error('Failed to update speech profile:', error);
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
      status: session.status as 'completed' | 'incomplete',
      speechMetricsAverage: session.speech_metrics ? {
        overallConfidence: session.speech_metrics.confidence?.overallConfidence || 0,
        fluencyScore: session.speech_metrics.fluency?.fluencyScore || 0,
        speechRate: session.speech_metrics.timing?.speechRate || 0,
        voiceStability: session.speech_metrics.voice?.voiceStability || 0
      } : undefined
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
      improvement: Math.round(improvement),
      speechMetrics: null
    };
  }

  try {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('overall_score, duration, created_at, speech_metrics, responses')
      .eq('status', 'completed')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching interview stats:', error);
      return { totalInterviews: 0, averageScore: 0, totalHours: 0, improvement: 0, speechMetrics: null };
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

    // Calculate speech metrics averages
    const sessionsWithSpeech = data.filter(session => 
      session.speech_metrics && Object.keys(session.speech_metrics).length > 0
    );

    let speechMetrics = null;
    if (sessionsWithSpeech.length > 0) {
      const avgConfidence = sessionsWithSpeech.reduce((sum, session) => 
        sum + (session.speech_metrics?.confidence?.overallConfidence || 0), 0) / sessionsWithSpeech.length;
      
      const avgFluency = sessionsWithSpeech.reduce((sum, session) => 
        sum + (session.speech_metrics?.fluency?.fluencyScore || 0), 0) / sessionsWithSpeech.length;
      
      const avgSpeechRate = sessionsWithSpeech.reduce((sum, session) => 
        sum + (session.speech_metrics?.timing?.speechRate || 0), 0) / sessionsWithSpeech.length;
      
      const avgVoiceStability = sessionsWithSpeech.reduce((sum, session) => 
        sum + (session.speech_metrics?.voice?.voiceStability || 0), 0) / sessionsWithSpeech.length;

      speechMetrics = {
        averageConfidence: Math.round(avgConfidence),
        averageFluency: Math.round(avgFluency),
        averageSpeechRate: Number(avgSpeechRate.toFixed(2)),
        averageVoiceStability: Math.round(avgVoiceStability),
        voiceSessionCount: sessionsWithSpeech.length
      };
    }
    
    return {
      totalInterviews,
      averageScore: Math.round(averageScore),
      totalHours: Math.round(totalHours * 10) / 10,
      improvement: Math.round(improvement),
      speechMetrics
    };

  } catch (error) {
    console.error('Failed to fetch interview stats:', error);
    return { totalInterviews: 0, averageScore: 0, totalHours: 0, improvement: 0, speechMetrics: null };
  }
};

export const getUserStrengthsAndWeaknesses = async () => {
  if (!isSupabaseConfigured()) {
    return { strengths: [], weaknesses: [], categories: {} };
  }

  try {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('responses, overall_score, created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(20); // Analyze last 20 interviews

    if (error) {
      console.error('Error fetching interview data for analysis:', error);
      return { strengths: [], weaknesses: [], categories: {} };
    }

    // Analyze responses for patterns
    const allResponses = data.flatMap(session => session.responses || []);
    const categoryScores: { [key: string]: number[] } = {};
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Group responses by question type/category
    allResponses.forEach(response => {
      if (response.analysis) {
        const questionType = response.questionType || 'general';
        if (!categoryScores[questionType]) {
          categoryScores[questionType] = [];
        }
        categoryScores[questionType].push(response.analysis.score);
      }
    });

    // Calculate average scores per category
    const categoryAverages: { [key: string]: number } = {};
    Object.keys(categoryScores).forEach(category => {
      const scores = categoryScores[category];
      categoryAverages[category] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    // Determine strengths and weaknesses based on scores
    Object.entries(categoryAverages).forEach(([category, averageScore]) => {
      if (averageScore >= 8) {
        strengths.push(`${category.charAt(0).toUpperCase() + category.slice(1)} questions`);
      } else if (averageScore <= 5) {
        weaknesses.push(`${category.charAt(0).toUpperCase() + category.slice(1)} questions`);
      }
    });

    // Analyze speech metrics if available
    const speechSessions = data.filter(session => 
      session.responses?.some((r: any) => r.speechMetrics)
    );

    if (speechSessions.length > 0) {
      const avgConfidence = speechSessions.reduce((sum, session) => {
        const sessionConfidence = session.responses?.reduce((s: number, r: any) => 
          s + (r.speechMetrics?.confidence?.overallConfidence || 0), 0) / (session.responses?.length || 1);
        return sum + sessionConfidence;
      }, 0) / speechSessions.length;

      if (avgConfidence >= 7) {
        strengths.push('Voice confidence and clarity');
      } else if (avgConfidence <= 4) {
        weaknesses.push('Voice confidence and clarity');
      }
    }

    // Add general strengths/weaknesses based on overall performance
    const recentScores = data.slice(0, 5).map(session => session.overall_score);
    const recentAverage = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;

    if (recentAverage >= 80) {
      strengths.push('Strong overall interview performance');
    } else if (recentAverage <= 60) {
      weaknesses.push('Overall interview performance needs improvement');
    }

    // Add default strengths/weaknesses if none found
    if (strengths.length === 0) {
      strengths.push('Consistent participation in practice sessions');
    }
    if (weaknesses.length === 0) {
      weaknesses.push('Continue practicing to identify specific areas for improvement');
    }

    return {
      strengths: strengths.slice(0, 3), // Limit to top 3
      weaknesses: weaknesses.slice(0, 3), // Limit to top 3
      categories: categoryAverages
    };

  } catch (error) {
    console.error('Failed to analyze strengths and weaknesses:', error);
    return { 
      strengths: ['Consistent participation in practice sessions'], 
      weaknesses: ['Continue practicing to identify specific areas for improvement'],
      categories: {}
    };
  }
};