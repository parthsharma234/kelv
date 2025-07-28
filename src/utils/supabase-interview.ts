import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { InterviewHistory, InterviewSetup, CollegeInterviewSetup } from '../types/interview';

// 🧠 Behavioral Insights Interfaces
export interface BehavioralInsight {
  id?: string;
  session_id: string;
  response: string;
  score: number;
  response_time: number;
  confidence: 'high' | 'medium' | 'low';
  engagement: 'high' | 'medium' | 'low';
  communication_style: 'structured' | 'conversational' | 'formal' | 'casual';
  stress_indicators: boolean;
  question_context: string;
  timestamp: number;
  created_at?: string;
}

export interface BehavioralSummary {
  session_id: string;
  total_responses: number;
  average_confidence: number;
  average_engagement: number;
  dominant_communication_style: string;
  stress_indicators_count: number;
  confidence_trend: 'improving' | 'declining' | 'stable';
  engagement_trend: 'improving' | 'declining' | 'stable';
  overall_behavioral_score: number;
  created_at?: string;
}

// Realtime transcript interfaces
export interface TranscriptChunk {
  id: string;
  session_id: string;
  speaker: 'user' | 'assistant';
  text: string;
  timestamp: number;
  is_partial: boolean;
  created_at: string;
}

export interface RealtimeSessionMetadata {
  session_id: string;
  user_id: string;
  setup: InterviewSetup | CollegeInterviewSetup;
  interview_type?: string;
  start_time: string;
  end_time?: string;
  status: 'active' | 'paused' | 'completed' | 'error';
  model_type: string;
  total_duration: number;
  question_count: number;
  created_at: string;
  updated_at: string;
}

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
    }      const sessionData: any = {
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

    console.log('Creating initial interview session:', {
      sessionId: sessionId,
      interviewType: interviewType,
      userId: user.id,
      status: sessionData.status
    });

    const { error } = await supabase
      .from('interview_sessions')
      .insert(sessionData);

    if (error) {
      console.error('Error creating initial interview session:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      throw error;
    }
    
    console.log('Initial interview session created successfully with ID:', sessionId);
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
      console.error('saveInterviewSession: User not authenticated');
      throw new Error('User not authenticated');
    }
    
    console.log('saveInterviewSession: User authenticated:', user.id);

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
      voice_metrics_summary: voiceMetricsSummary // <-- Save the summary here
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

    // Update the existing session record instead of inserting
    console.log('Attempting to update session with ID:', sessionData.id);
    
    // First check if the session exists
    const { data: existingSession, error: checkError } = await supabase
      .from('interview_sessions')
      .select('id, status')
      .eq('id', sessionData.id)
      .single();
    
    if (checkError) {
      console.error('Error checking existing session:', checkError);
      if (checkError.code === 'PGRST116') {
        console.error('Session not found in database, ID:', sessionData.id);
        // Try to create a new session instead
        console.log('Attempting to create new session since it was not found...');
        const { error: insertError } = await supabase
          .from('interview_sessions')
          .insert({
            ...updateData,
            id: sessionData.id,
            user_id: user.id,
            created_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Error creating new session:', insertError);
          throw insertError;
        }
        console.log('Successfully created new session with ID:', sessionData.id);
        return;
      }
      throw checkError;
    }
    
    console.log('Found existing session:', existingSession);
    
    const { error } = await supabase
      .from('interview_sessions')
      .update(updateData)
      .eq('id', sessionData.id);

    if (error) {
      console.error('Error updating interview session:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    console.log('Interview session saved successfully with ID:', sessionData.id);

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
    // Fetch from both interview_sessions and realtime_interview_sessions
    const [standardSessionsResult, realtimeSessionsResult] = await Promise.all([
      supabase
        .from('interview_sessions')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false }),
      supabase
        .from('realtime_interview_sessions')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
    ]);

    if (standardSessionsResult.error) {
      console.error('Error fetching standard interview history:', standardSessionsResult.error);
    }

    if (realtimeSessionsResult.error) {
      console.error('Error fetching realtime interview history:', realtimeSessionsResult.error);
    }

    const standardSessions = standardSessionsResult.data || [];
    const realtimeSessions = realtimeSessionsResult.data || [];

    console.log('Fetched interview history from Supabase:', {
      standardSessions: standardSessions.length,
      realtimeSessions: realtimeSessions.length,
      total: standardSessions.length + realtimeSessions.length
    });

    // Transform standard sessions to InterviewHistory format
    const transformedStandardHistory = standardSessions.map(session => ({
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
      interviewType: session.interview_type,
      isRealtime: false
    }));

    // Transform realtime sessions to InterviewHistory format
    const transformedRealtimeHistory = realtimeSessions.map(session => ({
      id: session.session_id, // Use session_id as the ID for realtime sessions
      date: new Date(session.created_at),
      setup: session.setup,
      overallScore: session.overall_score || 0,
      duration: session.total_duration || 0,
      questionsAnswered: session.questions_answered || 0,
      status: 'completed' as const,
      speechMetricsAverage: session.speech_metrics ? {
        overallConfidence: session.speech_metrics.confidence?.overallConfidence || 0,
        fluencyScore: session.speech_metrics.fluency?.fluencyScore || 0,
        speechRate: session.speech_metrics.timing?.speechRate || 0,
        voiceStability: session.speech_metrics.voice?.voiceStability || 0
      } : undefined,
      interviewType: session.interview_type === 'college' ? 'college' : (session.focused_type ? session.focused_type : 'standard'),
      isRealtime: true
    }));

    // Merge and sort by date (most recent first)
    const allHistory = [...transformedStandardHistory, ...transformedRealtimeHistory]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log('Transformed interview history:', allHistory.map(h => ({
      id: h.id,
      interviewType: h.interviewType,
      isRealtime: h.isRealtime,
      speechMetricsIncluded: !!h.speechMetricsAverage
    })));

    return allHistory;

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
    // Fetch from both tables
    const [standardResult, realtimeResult] = await Promise.all([
      supabase
        .from('interview_sessions')
        .select('overall_score, duration, created_at, speech_metrics, responses, interview_type')
        .eq('status', 'completed')
        .order('created_at', { ascending: true }),
      supabase
        .from('realtime_interview_sessions')
        .select('overall_score, total_duration, created_at, speech_metrics, responses, interview_type')
        .eq('status', 'completed')
        .order('created_at', { ascending: true })
    ]);

    if (standardResult.error) {
      console.error('Error fetching standard interview stats:', standardResult.error);
    }

    if (realtimeResult.error) {
      console.error('Error fetching realtime interview stats:', realtimeResult.error);
    }

    const standardData = standardResult.data || [];
    const realtimeData = realtimeResult.data || [];

    // Combine and normalize data
    const allData = [
      ...standardData.map(session => ({
        ...session,
        duration: session.duration,
        isRealtime: false
      })),
      ...realtimeData.map(session => ({
        ...session,
        duration: session.total_duration || 0,
        isRealtime: true
      }))
    ];

    const totalInterviews = allData.length;
    const averageScore = allData.reduce((sum, session) => sum + (session.overall_score || 0), 0) / totalInterviews || 0;
    const totalHours = allData.reduce((sum, session) => sum + session.duration, 0) / 3600;
    
    let improvement = 0;
    if (totalInterviews >= 6) {
      const recent = allData.slice(-3).reduce((sum, session) => sum + (session.overall_score || 0), 0) / 3;
      const initial = allData.slice(0, 3).reduce((sum, session) => sum + (session.overall_score || 0), 0) / 3;
      improvement = ((recent - initial) / initial) * 100;
    }

    // Calculate focused interview stats (including realtime focused interviews)
    const focusedSessions = allData.filter(session => session.interview_type && session.interview_type !== 'college');
    const focusedInterviews = focusedSessions.length;
    const focusedAverageScore = focusedSessions.length > 0 
      ? focusedSessions.reduce((sum, session) => sum + (session.overall_score || 0), 0) / focusedSessions.length 
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
    const sessionsWithSpeech = allData.filter(session => 
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
    
    // Try to find the interview in both tables
    const [standardResult, realtimeResult] = await Promise.all([
      supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', interviewId)
        .single(),
      supabase
        .from('realtime_interview_sessions')
        .select('*')
        .eq('session_id', interviewId)
        .single()
    ]);

    let data = null;
    let isRealtime = false;

    if (standardResult.data) {
      data = standardResult.data;
      isRealtime = false;
      console.log('Found interview in standard sessions table');
    } else if (realtimeResult.data) {
      data = realtimeResult.data;
      isRealtime = true;
      console.log('Found interview in realtime sessions table');
    } else {
      console.log('Interview not found in either table');
      return null;
    }

    console.log('Supabase data found:', !!data, data ? data.interview_type : 'N/A', 'isRealtime:', isRealtime);

    // Transform Supabase data to sessionData format expected by results components
    const transformedData = {
      id: isRealtime ? data.session_id : data.id,
      setup: data.setup,
      overallScore: data.overall_score || 0,
      duration: isRealtime ? data.total_duration : data.duration,
      questionsAnswered: data.questions_answered || 0,
      status: data.status as 'completed' | 'incomplete',
      responses: data.responses || [],
      questions: data.questions || [],
      interviewType: data.interview_type || 'realtime',
      speechMetrics: data.speech_metrics ? [data.speech_metrics] : [],
      date: new Date(data.created_at),
      startTime: new Date(data.created_at),
      endTime: isRealtime && data.end_time ? new Date(data.end_time) : 
               data.created_at ? new Date(new Date(data.created_at).getTime() + (isRealtime ? data.total_duration : data.duration) * 1000) : undefined,
      speechMetricsAverage: data.speech_metrics ? {
        overallConfidence: data.speech_metrics.confidence?.overallConfidence || 0,
        fluencyScore: data.speech_metrics.fluency?.fluencyScore || 0,
        speechRate: data.speech_metrics.timing?.speechRate || 0,
        voiceStability: data.speech_metrics.voice?.voiceStability || 0
      } : undefined,
      // Include metrics for college interviews
      metrics: data.metrics || undefined,
      // Include voice metrics if present
      voiceMetrics: data.voice_metrics_summary || data.speech_metrics || undefined,
      // Include realtime-specific data
      isRealtime: isRealtime,
      transcript: data.transcript || undefined,
      sessionMetadata: data.session_metadata || undefined
    };
    
    console.log('Transformed Supabase data:', transformedData);
    return transformedData;

  } catch (error) {
    console.error('Failed to fetch interview by ID:', error);
    return null;
  }
};

// Realtime transcript functions
export const saveTranscriptChunk = async (chunk: Omit<TranscriptChunk, 'created_at'>): Promise<void> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, skipping transcript chunk save');
    return;
  }

  try {
    const { error } = await supabase
      .from('transcript_chunks')
      .insert({
        ...chunk,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving transcript chunk:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to save transcript chunk:', error);
    throw error;
  }
};

export const getTranscriptBySession = async (sessionId: string): Promise<TranscriptChunk[]> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, returning empty transcript');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('transcript_chunks')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching transcript:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch transcript:', error);
    throw error;
  }
};

export const createRealtimeSession = async (metadata: Omit<RealtimeSessionMetadata, 'created_at' | 'updated_at'>): Promise<void> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, skipping realtime session creation');
    return;
  }

  try {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('realtime_interview_sessions')
      .insert({
        ...metadata,
        created_at: now,
        updated_at: now
      });

    if (error) {
      console.error('Error creating realtime session:', error);
      throw error;
    }

    console.log('Realtime session created successfully:', metadata.session_id);
  } catch (error) {
    console.error('Failed to create realtime session:', error);
    throw error;
  }
};

export const updateRealtimeSession = async (
  sessionId: string, 
  updates: Partial<Pick<RealtimeSessionMetadata, 'end_time' | 'status' | 'total_duration' | 'question_count'>>
): Promise<void> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, skipping realtime session update');
    return;
  }

  try {
    const { error } = await supabase
      .from('realtime_interview_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error updating realtime session:', error);
      throw error;
    }

    console.log('Realtime session updated successfully:', sessionId);
  } catch (error) {
    console.error('Failed to update realtime session:', error);
    throw error;
  }
};

export const getRealtimeSession = async (sessionId: string): Promise<RealtimeSessionMetadata | null> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, returning null');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('realtime_interview_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      console.error('Error fetching realtime session:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch realtime session:', error);
    throw error;
  }
};

// Save voice timeline data for realtime interviews
export const saveVoiceTimelineData = async (sessionId: string, voiceTimeline: any[], voiceMetrics: any) => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, skipping voice timeline save');
    return;
  }

  try {
    const { error } = await supabase
      .from('interview_sessions')
      .update({
        speech_metrics: {
          timeline: voiceTimeline,
          summary: voiceMetrics,
          analyzed_at: new Date().toISOString()
        }
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error saving voice timeline:', error);
      throw error;
    }
    
    console.log('Voice timeline saved successfully for session:', sessionId);
  } catch (error) {
    console.error('Failed to save voice timeline:', error);
    throw error;
  }
};

// Get voice timeline data for a session
export const getVoiceTimelineData = async (sessionId: string) => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, returning empty timeline');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('speech_metrics')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching voice timeline:', error);
      return null;
    }

    return data?.speech_metrics || null;
  } catch (error) {
    console.error('Failed to fetch voice timeline:', error);
    return null;
  }
};

// Save complete realtime interview session with structured Q&A data
export const saveRealtimeInterviewSession = async (sessionData: any): Promise<void> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, skipping realtime interview save');
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('saveRealtimeInterviewSession: User not authenticated');
      throw new Error('User not authenticated');
    }

    console.log('saveRealtimeInterviewSession: User authenticated:', user.id);

    // Calculate metrics from responses
    let metrics = null;
    if (sessionData.responses && sessionData.responses.length > 0) {
      const validResponses = sessionData.responses.filter((r: any) => r.analysis);
      if (validResponses.length > 0) {
        const avgClarity = Math.round(validResponses.reduce((sum: number, r: any) => sum + (r.analysis.clarity || 0), 0) / validResponses.length);
        const avgRelevance = Math.round(validResponses.reduce((sum: number, r: any) => sum + (r.analysis.relevance || 0), 0) / validResponses.length);
        const avgDepth = Math.round(validResponses.reduce((sum: number, r: any) => sum + (r.analysis.depth || 0), 0) / validResponses.length);
        const avgConfidence = Math.round(validResponses.reduce((sum: number, r: any) => sum + (r.analysis.confidence || 0), 0) / validResponses.length);
        const avgStructure = Math.round(validResponses.reduce((sum: number, r: any) => sum + (r.analysis.structure || 0), 0) / validResponses.length);

        metrics = {
          clarity: avgClarity,
          relevance: avgRelevance,
          depth: avgDepth,
          confidence: avgConfidence,
          structure: avgStructure,
          problem_solving: Math.round((avgDepth + avgStructure) / 2),
          communication: Math.round((avgClarity + avgConfidence) / 2)
        };
      }
    }

    // Update the existing realtime session with complete data
    const { error } = await supabase
      .from('realtime_interview_sessions')
      .update({
        end_time: new Date().toISOString(),
        status: 'completed',
        total_duration: sessionData.duration || 0,
        question_count: sessionData.questionCount || 0,
        questions: sessionData.questions || [],
        responses: sessionData.responses || [],
        overall_score: sessionData.overallScore || 70,
        questions_answered: sessionData.questionsAnswered || 0,
        speech_metrics: sessionData.speechMetrics || {},
        voice_metrics_summary: sessionData.voiceMetrics,
        voice_timeline: sessionData.voiceTimeline,
        metrics: metrics,
        session_metadata: {
          session_id: sessionData.sessionId,
          is_realtime: true,
          model_type: 'gpt-4o-realtime-preview',
          focused_type: sessionData.focusedType,
          transcript: sessionData.transcript
        },
        transcript: sessionData.transcript,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionData.sessionId);

    if (error) {
      console.error('Error saving realtime interview session:', error);
      throw error;
    }

    console.log('Realtime interview session saved successfully');
  } catch (error) {
    console.error('Failed to save realtime interview session:', error);
    throw error;
  }
};

// 🧠 BEHAVIORAL INSIGHTS FUNCTIONS

export const saveBehavioralInsight = async (insight: Omit<BehavioralInsight, 'id' | 'created_at'>): Promise<void> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, skipping behavioral insight save');
    return;
  }

  try {
    const { error } = await supabase
      .from('behavioral_insights')
      .insert(insight);

    if (error) {
      console.error('Error saving behavioral insight:', error);
      // Don't throw error - just log it and continue
      return;
    }

    console.log('Behavioral insight saved successfully');
  } catch (error) {
    console.error('Failed to save behavioral insight:', error);
    // Don't throw error - just log it and continue
    return;
  }
};

export const saveBehavioralSummary = async (summary: Omit<BehavioralSummary, 'created_at'>): Promise<void> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, skipping behavioral summary save');
    return;
  }

  try {
    const { error } = await supabase
      .from('behavioral_summaries')
      .insert(summary);

    if (error) {
      console.error('Error saving behavioral summary:', error);
      // Don't throw error - just log it and continue
      return;
    }

    console.log('Behavioral summary saved successfully');
  } catch (error) {
    console.error('Failed to save behavioral summary:', error);
    // Don't throw error - just log it and continue
    return;
  }
};

export const getBehavioralInsightsBySession = async (sessionId: string): Promise<BehavioralInsight[]> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, returning empty behavioral insights');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('behavioral_insights')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching behavioral insights:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch behavioral insights:', error);
    return [];
  }
};

export const getBehavioralSummaryBySession = async (sessionId: string): Promise<BehavioralSummary | null> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, returning null behavioral summary');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('behavioral_summaries')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching behavioral summary:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch behavioral summary:', error);
    return null;
  }
};

export const calculateBehavioralSummary = (insights: BehavioralInsight[]): Omit<BehavioralSummary, 'session_id' | 'created_at'> => {
  if (insights.length === 0) {
    return {
      total_responses: 0,
      average_confidence: 0,
      average_engagement: 0,
      dominant_communication_style: 'conversational',
      stress_indicators_count: 0,
      confidence_trend: 'stable',
      engagement_trend: 'stable',
      overall_behavioral_score: 0
    };
  }

  // Calculate averages
  const confidenceScores = insights.map(i => {
    switch (i.confidence) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  });
  
  const engagementScores = insights.map(i => {
    switch (i.engagement) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  });

  const averageConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
  const averageEngagement = engagementScores.reduce((sum, score) => sum + score, 0) / engagementScores.length;

  // Find dominant communication style
  const styleCounts = insights.reduce((acc, insight) => {
    acc[insight.communication_style] = (acc[insight.communication_style] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dominantStyle = Object.entries(styleCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'conversational';

  // Count stress indicators
  const stressIndicatorsCount = insights.filter(i => i.stress_indicators).length;

  // Calculate trends
  const midPoint = Math.floor(insights.length / 2);
  const earlyConfidence = confidenceScores.slice(0, midPoint);
  const lateConfidence = confidenceScores.slice(midPoint);
  const earlyEngagement = engagementScores.slice(0, midPoint);
  const lateEngagement = engagementScores.slice(midPoint);

  const earlyAvgConfidence = earlyConfidence.length > 0 ? 
    earlyConfidence.reduce((sum, score) => sum + score, 0) / earlyConfidence.length : 2;
  const lateAvgConfidence = lateConfidence.length > 0 ? 
    lateConfidence.reduce((sum, score) => sum + score, 0) / lateConfidence.length : 2;
  const earlyAvgEngagement = earlyEngagement.length > 0 ? 
    earlyEngagement.reduce((sum, score) => sum + score, 0) / earlyEngagement.length : 2;
  const lateAvgEngagement = lateEngagement.length > 0 ? 
    lateEngagement.reduce((sum, score) => sum + score, 0) / lateEngagement.length : 2;

  const confidenceTrend = lateAvgConfidence > earlyAvgConfidence + 0.3 ? 'improving' :
                         lateAvgConfidence < earlyAvgConfidence - 0.3 ? 'declining' : 'stable';
  
  const engagementTrend = lateAvgEngagement > earlyAvgEngagement + 0.3 ? 'improving' :
                         lateAvgEngagement < earlyAvgEngagement - 0.3 ? 'declining' : 'stable';

  // Calculate overall behavioral score (0-100)
  const overallBehavioralScore = Math.round(
    ((averageConfidence / 3) * 0.4 + (averageEngagement / 3) * 0.4 + (1 - stressIndicatorsCount / insights.length) * 0.2) * 100
  );

  return {
    total_responses: insights.length,
    average_confidence: Math.round(averageConfidence * 10) / 10,
    average_engagement: Math.round(averageEngagement * 10) / 10,
    dominant_communication_style: dominantStyle,
    stress_indicators_count: stressIndicatorsCount,
    confidence_trend: confidenceTrend,
    engagement_trend: engagementTrend,
    overall_behavioral_score: overallBehavioralScore
  };
};