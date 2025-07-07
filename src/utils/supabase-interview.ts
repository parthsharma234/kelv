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

<<<<<<< Updated upstream
=======
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

    // Calculate interview metrics based on interview type and responses
    const calculateInterviewMetrics = (responses: any[], interviewType: string) => {
      if (!responses || responses.length === 0) {
        return null;
      }
      
      const validResponses = responses.filter((r: any) => r.analysis);
      if (validResponses.length === 0) {
        return null;
      }
      
      if (interviewType === 'college') {
        // College interview metrics
        const authenticityScores = validResponses.map((r: any) => r.analysis.authenticity || 0);
        const passionScores = validResponses.map((r: any) => r.analysis.passion || 0);
        const clarityScores = validResponses.map((r: any) => r.analysis.clarity || 0);
        const specificityScores = validResponses.map((r: any) => r.analysis.specificity || 0);
        
        return {
          authenticity: Math.round(authenticityScores.reduce((a: number, b: number) => a + b, 0) / authenticityScores.length),
          passion: Math.round(passionScores.reduce((a: number, b: number) => a + b, 0) / passionScores.length),
          clarity: Math.round(clarityScores.reduce((a: number, b: number) => a + b, 0) / clarityScores.length),
          specificity: Math.round(specificityScores.reduce((a: number, b: number) => a + b, 0) / specificityScores.length)
        };
      } else {
        // Focused interview metrics
        const problemSolvingScores = validResponses.map((r: any) => r.analysis.problem_solving || 0);
        const communicationScores = validResponses.map((r: any) => r.analysis.communication || 0);
        const depthScores = validResponses.map((r: any) => r.analysis.depth || 0);
        const relevanceScores = validResponses.map((r: any) => r.analysis.relevance || 0);
        
        return {
          problem_solving: Math.round(problemSolvingScores.reduce((a: number, b: number) => a + b, 0) / problemSolvingScores.length),
          communication: Math.round(communicationScores.reduce((a: number, b: number) => a + b, 0) / communicationScores.length),
          depth: Math.round(depthScores.reduce((a: number, b: number) => a + b, 0) / depthScores.length),
          relevance: Math.round(relevanceScores.reduce((a: number, b: number) => a + b, 0) / relevanceScores.length)
        };
      }
    };
    
    const calculatedMetrics = calculateInterviewMetrics(sessionData.responses, sessionData.type || sessionData.interviewType || 'standard');

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
      voice_metrics_summary: voiceMetricsSummary, // <-- Save the summary here
      transcript: sessionData.transcript, // Add transcript to the session data
      // Note: metrics column doesn't exist in current DB schema, so we don't include it
    };

    console.log('Saving interview session with data:', {
      sessionId: sessionData.id,
      interviewType: updateData.interview_type,
      status: updateData.status,
      speechMetricsIncluded: !!sessionData.speechMetrics,
      voiceMetricsSummary: voiceMetricsSummary,
      calculatedMetrics: calculatedMetrics,
      responsesCount: sessionData.responses ? sessionData.responses.length : 0,
      questionsCount: sessionData.questions ? sessionData.questions.length : 0
    });

>>>>>>> Stashed changes
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
      .select('overall_score, duration, created_at, speech_metrics')
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
        averageSpeechRate: Math.round(avgSpeechRate),
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