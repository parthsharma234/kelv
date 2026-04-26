import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { InterviewHistory, InterviewSetup } from '../types/interview';

const HISTORY_STORAGE_KEY = 'kelv-interview-history';
const PLATFORM_RESULTS_STORAGE_KEY = 'kelv-platform-results';

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
  setup: InterviewSetup;
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

const getLocalHistory = (): InterviewHistory[] => {
  const localHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
  return localHistory ? JSON.parse(localHistory) : [];
};

const saveLocalHistory = (history: InterviewHistory[]) => {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
};

const getLocalPlatformResults = (): any[] => {
  const localResults = localStorage.getItem(PLATFORM_RESULTS_STORAGE_KEY);
  return localResults ? JSON.parse(localResults) : [];
};

const saveLocalPlatformResults = (results: any[]) => {
  localStorage.setItem(PLATFORM_RESULTS_STORAGE_KEY, JSON.stringify(results));
};

const buildInterviewSetupFromResult = (sessionData: any): InterviewSetup => ({
  industry: sessionData?.jobContext?.industry || 'General',
  jobType: sessionData?.jobContext?.role || 'Mock Interview',
  experienceLevel: sessionData?.jobContext?.experienceLevel || 'General',
  interviewMode: 'voice'
});

const buildHistoryEntryFromResult = (sessionData: any): InterviewHistory => {
  const transcript = Array.isArray(sessionData?.transcript) ? sessionData.transcript : [];
  const questionsAnswered = transcript.filter((entry: any) => entry.role === 'user').length;
  const savedAt = sessionData?.savedAt || new Date().toISOString();

  return {
    id: sessionData.id,
    date: new Date(savedAt),
    setup: buildInterviewSetupFromResult(sessionData),
    overallScore: sessionData?.metrics?.overallScore || 0,
    duration: sessionData?.duration || 0,
    questionsAnswered,
    status: 'completed',
    speechMetricsAverage: sessionData?.metrics ? {
      overallConfidence: sessionData.metrics.presenceScore || 0,
      fluencyScore: sessionData.metrics.articulationScore || 0,
      speechRate: sessionData.metrics.wpm || 0,
      voiceStability: sessionData.metrics.deliveryScore || 0
    } : undefined,
    interviewType: sessionData?.interviewType || 'standard'
  };
};

const mergeHistoryEntries = (remoteHistory: InterviewHistory[], localHistory: InterviewHistory[]) => {
  const merged = [...remoteHistory];
  const existingIds = new Set(remoteHistory.map((entry) => entry.id));

  localHistory.forEach((entry) => {
    if (!existingIds.has(entry.id)) {
      merged.push({
        ...entry,
        date: new Date(entry.date)
      });
    }
  });

  return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const deriveStrengthsAndWeaknessesFromLocalResults = () => {
  const results = getLocalPlatformResults().slice(0, 10);
  const strengthCounts: Record<string, number> = {};
  const weaknessCounts: Record<string, number> = {};

  results.forEach((result: any) => {
    (result?.metrics?.strengths || []).forEach((item: any) => {
      if (item?.area) {
        strengthCounts[item.area] = (strengthCounts[item.area] || 0) + 1;
      }
    });

    (result?.metrics?.weaknesses || []).forEach((item: any) => {
      if (item?.area) {
        weaknessCounts[item.area] = (weaknessCounts[item.area] || 0) + 1;
      }
    });
  });

  const strengths = Object.entries(strengthCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label]) => label);

  const weaknesses = Object.entries(weaknessCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label]) => label);

  return { strengths, weaknesses, categories: {} };
};

export const createInitialInterviewSession = async (sessionId: string, setup: InterviewSetup, interviewType?: string): Promise<void> => {
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

export const savePlatformInterviewResult = async (sessionData: any): Promise<string> => {
  const sessionId = sessionData?.id || `kelv_${Date.now()}`;
  const savedAt = new Date().toISOString();
  const payload = {
    ...sessionData,
    id: sessionId,
    savedAt,
    interviewType: sessionData?.interviewType || 'standard'
  };

  try {
    const localResults = getLocalPlatformResults().filter((entry: any) => entry.id !== sessionId);
    localResults.unshift(payload);
    saveLocalPlatformResults(localResults);

    const localHistory = getLocalHistory().filter((entry) => entry.id !== sessionId);
    localHistory.unshift(buildHistoryEntryFromResult(payload));
    saveLocalHistory(localHistory);
  } catch (error) {
    console.error('Failed to save platform result locally:', error);
  }

  if (!isSupabaseConfigured()) {
    return sessionId;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return sessionId;
    }

    const transcript = Array.isArray(payload.transcript) ? payload.transcript : [];
    const questionsAnswered = transcript.filter((entry: any) => entry.role === 'user').length;

    const upsertPayload = {
      id: sessionId,
      user_id: user.id,
      interview_type: payload.interviewType,
      setup: buildInterviewSetupFromResult(payload),
      overall_score: payload?.metrics?.overallScore || 0,
      duration: payload?.duration || 0,
      questions_answered: questionsAnswered,
      status: 'completed',
      transcript,
      metrics: payload?.metrics || {},
      voice_metrics_summary: {
        deliveryScore: payload?.metrics?.deliveryScore || 0,
        presenceScore: payload?.metrics?.presenceScore || 0,
        wpm: payload?.metrics?.wpm || 0,
        fillerWordCount: payload?.metrics?.fillerWordCount || 0
      },
      session_metadata: {
        source: 'vapi-platform',
        processing_source: payload?.processingSource || 'transcript-and-posture',
        job_context: payload?.jobContext || {},
        posture_data: payload?.postureData || null,
        per_question_analysis: payload?.perQuestionAnalysis || null
      },
      created_at: savedAt
    };

    const { error } = await supabase
      .from('interview_sessions')
      .upsert(upsertPayload, { onConflict: 'id' });

    if (error) {
      console.error('Failed to save platform result to Supabase:', error);
    }
  } catch (error) {
    console.error('Failed to save platform result remotely:', error);
  }

  return sessionId;
};


export const getInterviewHistory = async (): Promise<InterviewHistory[]> => {
  if (!isSupabaseConfigured()) {
    return getLocalHistory();
  }

  try {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching interview history:', error);
      return getLocalHistory();
    }    

    console.log('Fetched interview history from Supabase:', {
      total: data.length,
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

    return mergeHistoryEntries(transformedHistory, getLocalHistory());

  } catch (error) {
    console.error('Failed to fetch interview history:', error);
    return getLocalHistory();
  }
};

export const getInterviewStats = async () => {
  try {
    const history = await getInterviewHistory();
    const totalInterviews = history.length;
    const averageScore = history.reduce((sum, interview) => sum + interview.overallScore, 0) / totalInterviews || 0;
    const totalHours = history.reduce((sum, interview) => sum + interview.duration, 0) / 3600;

    let improvement = 0;
    if (totalInterviews >= 6) {
      const ordered = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const recent = ordered.slice(-3).reduce((sum, interview) => sum + interview.overallScore, 0) / 3;
      const initial = ordered.slice(0, 3).reduce((sum, interview) => sum + interview.overallScore, 0) / 3;
      improvement = ((recent - initial) / initial) * 100;
    }

    const focusedSessions = history.filter((interview) => interview.interviewType);
    const focusedInterviews = focusedSessions.length;
    const focusedAverageScore = focusedSessions.length > 0
      ? focusedSessions.reduce((sum, interview) => sum + interview.overallScore, 0) / focusedSessions.length
      : 0;

    const typeCounts: { [key: string]: number } = {};
    focusedSessions.forEach((session) => {
      if (session.interviewType) {
        typeCounts[session.interviewType] = (typeCounts[session.interviewType] || 0) + 1;
      }
    });
    const mostPracticedType = Object.keys(typeCounts).length > 0
      ? Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b, '')
      : '';

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
    return deriveStrengthsAndWeaknessesFromLocalResults();
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
      return deriveStrengthsAndWeaknessesFromLocalResults();
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

    const localDerived = deriveStrengthsAndWeaknessesFromLocalResults();

    return {
      strengths: [...strengths, ...localDerived.strengths].slice(0, 3),
      weaknesses: [...weaknesses, ...localDerived.weaknesses].slice(0, 3),
      categories: categoryAverages
    };

  } catch (error) {
    console.error('Failed to analyze strengths and weaknesses:', error);
    return deriveStrengthsAndWeaknessesFromLocalResults();
  }
};

export const getInterviewById = async (interviewId: string) => {
  console.log('getInterviewById called with ID:', interviewId);

  const localPlatformResult = getLocalPlatformResults().find((entry: any) => entry.id === interviewId);
  if (localPlatformResult) {
    return {
      ...localPlatformResult,
      transcript: localPlatformResult.transcript || [],
      metrics: localPlatformResult.metrics,
      perQuestionAnalysis: localPlatformResult.perQuestionAnalysis || null,
      postureData: localPlatformResult.postureData || undefined,
      jobContext: localPlatformResult.jobContext || undefined,
      processingSource: localPlatformResult.processingSource || 'transcript-and-posture',
      date: new Date(localPlatformResult.savedAt || Date.now())
    };
  }

  if (!isSupabaseConfigured()) {
    const interview = getLocalHistory().find((entry: any) => entry.id === interviewId);
    if (!interview) {
      return null;
    }

    return {
      id: interview.id,
      setup: interview.setup,
      overallScore: interview.overallScore,
      duration: interview.duration,
      questionsAnswered: interview.questionsAnswered,
      status: interview.status,
      date: new Date(interview.date)
    };
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
      metrics: data.metrics || undefined,
      voiceMetrics: data.speech_metrics || undefined,
      transcript: data.transcript || [],
      voice_metrics_summary: data.voice_metrics_summary || undefined,
      voiceTimeline: data.voice_timeline || undefined,
      postureData: data.session_metadata?.posture_data || undefined,
      perQuestionAnalysis: data.session_metadata?.per_question_analysis || null,
      jobContext: data.session_metadata?.job_context || undefined,
      processingSource: data.session_metadata?.processing_source || undefined
    };

    console.log('=== SUPABASE DATA LOADED ===');
    console.log('Transformed Supabase data:', transformedData);
    console.log('Responses structure:', transformedData.responses.map((r: any) => ({
      questionId: r.questionId,
      hasAnalysis: !!r.analysis,
      analysisKeys: r.analysis ? Object.keys(r.analysis) : [],
      analysisSample: r.analysis
    })));
    console.log('Questions:', transformedData.questions.length);
    console.log('Transcript chunks:', transformedData.transcript.length);
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

    // Save to interview_sessions table (like standard interviews)
    const { error } = await supabase
      .from('interview_sessions')
      .insert({
        user_id: user.id,
        interview_type: sessionData.interviewType || 'general',
        setup: sessionData.setup || {},
        questions: sessionData.questions || [],
        responses: sessionData.responses || [],
        overall_score: sessionData.overallScore || 70,
        duration: sessionData.duration || 0,
        questions_answered: sessionData.questionsAnswered || 0,
        metrics: metrics,
        voice_metrics_summary: sessionData.voiceMetrics,
        voice_timeline: sessionData.voiceTimeline,
        transcript: sessionData.transcript, // <-- Save transcript directly
        session_metadata: {
          session_id: sessionData.sessionId,
          is_realtime: true,
          model_type: 'gpt-4o-realtime-preview',
          focused_type: sessionData.focusedType
          // transcript: sessionData.transcript // <-- Remove this
        },
        created_at: sessionData.completedAt || new Date().toISOString()
      });

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
