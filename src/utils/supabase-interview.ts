import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { InterviewHistory, InterviewSetup, CollegeInterviewSetup } from '../types/interview';

// Standard interview setup interface
export interface SavedInterviewSetup {
  id: string;
  name: string;
  setup: InterviewSetup;
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// College interview setup interface  
export interface SavedCollegeInterviewSetup {
  id: string;
  name: string;
  setup: CollegeInterviewSetup;
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export const createInitialInterviewSession = async (sessionId: string, setup: InterviewSetup | CollegeInterviewSetup, interviewType?: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, skipping initial session creation');
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }    const sessionData: any = {
      id: sessionId,
      user_id: user.id,
      setup: setup,
      responses: [],
      overall_score: 0,
      duration: 0,
      questions_answered: 0,
      status: 'incomplete',
      speech_metrics: {},
      audio_data: {},
      interview_type: interviewType
    };



    const { error } = await supabase
      .from('interview_sessions')
      .insert(sessionData);if (error) {
      console.error('Error creating initial interview session:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      throw error;
    }
  } catch (error) {
    console.error('Failed to create initial interview session:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
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

    // --- Aggregate voice metrics from speech_metrics array ---
    let voiceMetricsSummary = null;
    if (Array.isArray(sessionData.speech_metrics) && sessionData.speech_metrics.length > 0) {
      const metricsList = sessionData.speech_metrics.map((sm: any) => sm.metrics).filter(Boolean);
      const count = metricsList.length;
      if (count > 0) {
        const sum = metricsList.reduce((acc: any, m: any) => ({
          speechRate: (acc.speechRate || 0) + (m.speechRate || 0),
          fluencyScore: (acc.fluencyScore || 0) + (m.fluencyScore || 0),
          voiceConfidence: (acc.voiceConfidence || 0) + (m.voiceConfidence || 0),
          deliveryScore: (acc.deliveryScore || 0) + (m.deliveryScore || 0),
          clarityScore: (acc.clarityScore || 0) + (m.clarityScore || 0),
          fillerWordCount: (acc.fillerWordCount || 0) + (m.fillerWordCount || 0),
        }), {});
        voiceMetricsSummary = {
          speechRate: Math.round(sum.speechRate / count),
          fluencyScore: Math.round(sum.fluencyScore / count),
          voiceConfidence: Math.round(sum.voiceConfidence / count),
          deliveryScore: Math.round(sum.deliveryScore / count),
          clarityScore: Math.round(sum.clarityScore / count),
          fillerWordCount: Math.round(sum.fillerWordCount / count),
        };
      }
    }

    // Prepare data for update
    const updateData: any = {
      responses: sessionData.responses,
      questions: sessionData.questions, // Also save questions array
      overall_score: sessionData.overallScore,
      duration: sessionData.duration,
      questions_answered: sessionData.responses.length,
      status: 'completed',
      speech_metrics: speechMetrics,
      audio_data: audioData,
      interview_type: sessionData.type || sessionData.interviewType, // Add interview type to database
      voice_metrics_summary: voiceMetricsSummary // <-- Save the summary here
    };

    console.log('Saving interview session with data:', {
      sessionId: sessionData.id,
      interviewType: updateData.interview_type,
      status: updateData.status,
      speechMetricsIncluded: !!sessionData.speechMetrics,
      voiceMetricsSummary: voiceMetricsSummary
    });

    // Update the existing session record instead of inserting
    const { error } = await supabase
      .from('interview_sessions')
      .update(updateData)
      .eq('id', sessionData.id);

    if (error) {
      console.error('Error updating interview session:', error);
      throw error;
    }

    console.log('Interview session saved successfully');

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
    throw error;
  }
};

export const deleteInterviewSetup = async (setupId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('interview_setups')
      .delete()
      .eq('id', setupId);

    if (error) {
      console.error('Error deleting interview setup:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete interview setup:', error);
    return false;
  }
};

// College Interview Setup functions
export const saveCollegeInterviewSetup = async (
  name: string, 
  setup: CollegeInterviewSetup, 
  isFavorite: boolean = false
): Promise<SavedCollegeInterviewSetup | null> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, skipping college setup save');
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('college_interview_setups')
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
      console.error('Error saving college interview setup:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to save college interview setup:', error);
    return null;
  }
};

export const getUserCollegeInterviewSetups = async (): Promise<SavedCollegeInterviewSetup[]> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, returning empty college setups');
    return [];
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('college_interview_setups')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching college interview setups:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch college interview setups:', error);
    return [];
  }
};

export const updateCollegeSetupUsage = async (setupId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    // First get the current usage count
    const { data: currentData, error: fetchError } = await supabase
      .from('college_interview_setups')
      .select('usage_count')
      .eq('id', setupId)
      .single();

    if (fetchError) {
      console.error('Error fetching current college setup usage count:', fetchError);
      return;
    }

    // Then update with incremented value
    const { error } = await supabase
      .from('college_interview_setups')
      .update({ 
        usage_count: (currentData.usage_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', setupId);

    if (error) {
      console.error('Error updating college setup usage:', error);
    }
  } catch (error) {
    console.error('Failed to update college setup usage:', error);
  }
};

export const deleteCollegeInterviewSetup = async (setupId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('college_interview_setups')
      .delete()
      .eq('id', setupId);

    if (error) {
      console.error('Error deleting college interview setup:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete college interview setup:', error);
    return false;
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

    console.log('Fetched interview history from Supabase:', {
      total: data.length,
      collegeInterviews: data.filter(s => s.interview_type === 'college').length,
      interviewTypes: data.map(s => s.interview_type)
    });

    // Transform Supabase data to InterviewHistory format
    const transformedHistory = data.map(session => ({
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
      } : undefined,
      interviewType: session.interview_type // Add this line
    }));

    console.log('Transformed interview history:', transformedHistory.map(h => ({
      id: h.id,
      interviewType: h.interviewType,
      speechMetricsIncluded: !!h.speechMetricsAverage
    })));

    return transformedHistory;

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
    
    // Calculate focused interview stats
    const focusedInterviews = history.filter((interview: any) => interview.interviewType).length;
    const focusedScores = history.filter((interview: any) => interview.interviewType).map((interview: any) => interview.overallScore);
    const focusedAverageScore = focusedScores.length > 0 ? focusedScores.reduce((sum: number, score: number) => sum + score, 0) / focusedScores.length : 0;
    
    // Find most practiced type
    const typeCounts: { [key: string]: number } = {};
    history.forEach((interview: any) => {
      if (interview.interviewType) {
        typeCounts[interview.interviewType] = (typeCounts[interview.interviewType] || 0) + 1;
      }
    });
    const mostPracticedType = Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b, '');
    
    return {
      totalInterviews,
      averageScore: Math.round(averageScore),
      totalHours: Math.round(totalHours * 10) / 10,
      improvement: Math.round(improvement),
      focusedInterviews,
      focusedAverageScore: Math.round(focusedAverageScore),
      mostPracticedType,
      speechMetrics: null
    };
  }

  try {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('overall_score, duration, created_at, speech_metrics, responses, interview_type')
      .eq('status', 'completed')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching interview stats:', error);
      return { 
        totalInterviews: 0, 
        averageScore: 0, 
        totalHours: 0, 
        improvement: 0, 
        focusedInterviews: 0,
        focusedAverageScore: 0,
        mostPracticedType: '',
        speechMetrics: null 
      };
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

    // Calculate focused interview stats
    const focusedSessions = data.filter(session => session.interview_type);
    const focusedInterviews = focusedSessions.length;
    const focusedAverageScore = focusedSessions.length > 0 
      ? focusedSessions.reduce((sum, session) => sum + session.overall_score, 0) / focusedSessions.length 
      : 0;
    
    // Find most practiced type
    const typeCounts: { [key: string]: number } = {};
    focusedSessions.forEach(session => {
      if (session.interview_type) {
        typeCounts[session.interview_type] = (typeCounts[session.interview_type] || 0) + 1;
      }
    });
    const mostPracticedType = Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b, '');

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
      focusedInterviews,
      focusedAverageScore: Math.round(focusedAverageScore),
      mostPracticedType,
      speechMetrics
    };

  } catch (error) {
    console.error('Failed to fetch interview stats:', error);
    return { 
      totalInterviews: 0, 
      averageScore: 0, 
      totalHours: 0, 
      improvement: 0, 
      focusedInterviews: 0,
      focusedAverageScore: 0,
      mostPracticedType: '',
      speechMetrics: null 
    };
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

    return {
      strengths: strengths.slice(0, 3), // Limit to top 3
      weaknesses: weaknesses.slice(0, 3), // Limit to top 3
      categories: categoryAverages
    };

  } catch (error) {
    console.error('Failed to analyze strengths and weaknesses:', error);
    return { 
      strengths: [], 
      weaknesses: [],
      categories: {}
    };
  }
};

export const getInterviewById = async (interviewId: string) => {
  console.log('getInterviewById called with ID:', interviewId);
  
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, using localStorage fallback');
    // Return localStorage data as fallback
    const localHistory = localStorage.getItem('kelv-interview-history');
    const history = localHistory ? JSON.parse(localHistory) : [];
    console.log('Local history found:', history.length, 'interviews');
    
    const interview = history.find((interview: any) => interview.id === interviewId);
    console.log('Found interview in localStorage:', !!interview, interview ? interview.type || interview.interviewType : 'N/A');
    
    if (!interview) {
      console.log('Interview not found in localStorage');
      return null;
    }

    // Transform localStorage data to sessionData format if needed
    const transformedData = {
      id: interview.id,
      setup: interview.setup,
      overallScore: interview.overallScore,
      duration: interview.duration,
      questionsAnswered: interview.questionsAnswered,
      status: interview.status,
      responses: interview.responses || [],
      questions: interview.questions || [],
      interviewType: interview.interviewType || interview.type,
      speechMetrics: interview.speechMetrics ? [interview.speechMetrics] : [],
      date: new Date(interview.date),
      startTime: interview.startTime ? new Date(interview.startTime) : new Date(interview.date),
      endTime: interview.endTime ? new Date(interview.endTime) : undefined,
      speechMetricsAverage: interview.speechMetricsAverage,
      // Include metrics for college interviews
      metrics: interview.metrics || undefined,
      // Include voice metrics if present
      voiceMetrics: interview.voiceMetrics || undefined
    };
    
    console.log('Transformed localStorage data:', transformedData);
    return transformedData;
  }
  try {
    console.log('Querying Supabase for interview ID:', interviewId);
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', interviewId)
      .single();

    if (error) {
      console.error('Error fetching interview by ID:', error);
      return null;
    }

    console.log('Supabase data found:', !!data, data ? data.interview_type : 'N/A');

    // Transform Supabase data to sessionData format expected by results components
    const transformedData = {
      id: data.id,
      setup: data.setup,
      overallScore: data.overall_score,
      duration: data.duration,
      questionsAnswered: data.questions_answered,
      status: data.status as 'completed' | 'incomplete',
      responses: data.responses || [],
      questions: data.questions || [],
      interviewType: data.interview_type,
      speechMetrics: data.speech_metrics ? [data.speech_metrics] : [],
      date: new Date(data.created_at),
      startTime: new Date(data.created_at),
      endTime: data.created_at ? new Date(new Date(data.created_at).getTime() + data.duration * 1000) : undefined,
      speechMetricsAverage: data.speech_metrics ? {
        overallConfidence: data.speech_metrics.confidence?.overallConfidence || 0,
        fluencyScore: data.speech_metrics.fluency?.fluencyScore || 0,
        speechRate: data.speech_metrics.timing?.speechRate || 0,
        voiceStability: data.speech_metrics.voice?.voiceStability || 0
      } : undefined,
      // Include metrics for college interviews
      metrics: data.metrics || undefined,
      // Include voice metrics if present
      voiceMetrics: data.speech_metrics || undefined
    };
    
    console.log('Transformed Supabase data:', transformedData);
    return transformedData;

  } catch (error) {
    console.error('Failed to fetch interview by ID:', error);
    return null;
  }
};