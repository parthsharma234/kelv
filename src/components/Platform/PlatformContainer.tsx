import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import PlatformDashboard from './PlatformDashboard';
import VapiInterviewSession from './VapiInterviewSession';
import InterviewProcessing from './InterviewProcessing';
import InterviewResults from './InterviewResults';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { AnalyticsEngine } from '../../utils/analyticsEngine';
import { PerQuestionAnalytics } from '../../utils/perQuestionAnalytics';
import { getInterviewById, savePlatformInterviewResult } from '../../utils/supabase-interview';

type PlatformState = 'dashboard' | 'interview' | 'processing' | 'results';

interface PlatformContainerProps {
  onFullScreenChange?: (isFullScreen: boolean) => void;
}

const PlatformContainer: React.FC<PlatformContainerProps> = ({ onFullScreenChange }) => {
  const { user, loading } = useAuth();
  useScrollToTop();

  const [currentState, setCurrentState] = useState<PlatformState>('dashboard');
  const [dashboardKey, setDashboardKey] = useState(0);
  const [sessionData, setSessionData] = useState<any>(null);

  // Ref to store session data immediately (prevents race conditions)
  const sessionDataRef = React.useRef<any>(null);

  // Helper function to scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Scroll to top on state changes
  React.useEffect(() => {
    scrollToTop();
  }, [currentState]);

  // Notify parent about full-screen state changes
  React.useEffect(() => {
    const isFullScreen = currentState === 'interview';

    if (onFullScreenChange) {
      onFullScreenChange(isFullScreen);
    }
  }, [currentState, onFullScreenChange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Go directly to interview (skip setup flow)
  const handleStartInterview = () => {
    setCurrentState('interview');
    scrollToTop();
  };

  const hydrateStoredSession = React.useCallback((data: any) => {
    if (!data) return null;

    const transcript = Array.isArray(data.transcript) ? data.transcript : [];
    const postureData = data.postureData || data.session_metadata?.posture_data;
    const jobContext = data.jobContext || data.session_metadata?.job_context || {
      role: data.setup?.jobType,
      industry: data.setup?.industry,
      experienceLevel: data.setup?.experienceLevel
    };

    const metrics = data.metrics || (transcript.length > 0
      ? AnalyticsEngine.process({
        durationSecs: data.duration || 60,
        transcript,
        role: jobContext?.role,
        postureData
      })
      : null);

    const perQuestionAnalysis = data.perQuestionAnalysis ||
      data.session_metadata?.per_question_analysis ||
      (transcript.length > 0 && metrics
        ? PerQuestionAnalytics.process(transcript, { postureData, overallMetrics: metrics })
        : null);

    return {
      ...data,
      transcript,
      postureData,
      jobContext,
      metrics,
      perQuestionAnalysis,
      processingSource: data.processingSource || data.session_metadata?.processing_source || 'transcript-and-posture'
    };
  }, []);

  const handleInterviewComplete = React.useCallback((data: any) => {
    if (!data) {
      console.error('❌ handleInterviewComplete: Received null/undefined data');
      return;
    }

    // Store session data in ref to ensure it's available immediately
    sessionDataRef.current = data;

    // Update React state
    setSessionData(data);

    // Transition to processing state
    requestAnimationFrame(() => {
      setCurrentState('processing');
      scrollToTop();
    });
  }, []);

  const handleBackToDashboard = () => {
    setCurrentState('dashboard');
    setSessionData(null);
    setDashboardKey(prev => prev + 1); // Force dashboard refresh
    scrollToTop();
  };

  return (
    <>
      {currentState === 'dashboard' && (
        <PlatformDashboard
          key={dashboardKey}
          onStartRealtimeInterview={handleStartInterview}
          onViewInterviewResults={async (id) => {
            const stored = await getInterviewById(id);
            const hydrated = hydrateStoredSession(stored);

            if (!hydrated) {
              console.error('Unable to load saved interview result:', id);
              return;
            }

            sessionDataRef.current = hydrated;
            setSessionData(hydrated);
            setCurrentState('results');
            scrollToTop();
          }}
        />
      )}

      {currentState === 'interview' && (
        <VapiInterviewSession
          onComplete={handleInterviewComplete}
          onBack={handleBackToDashboard}
        />
      )}

      {currentState === 'processing' && (
        <InterviewProcessing
          sessionData={sessionData || sessionDataRef.current}
          onComplete={async (results) => {
            // Merge processed metrics into session data
            const finalData = {
              ...(sessionData || sessionDataRef.current),
              ...results,
              interviewType: 'standard'
            };

            const savedId = await savePlatformInterviewResult(finalData);
            finalData.id = savedId;

            setSessionData(finalData);
            sessionDataRef.current = finalData;

            setCurrentState('results');
            scrollToTop();
          }}
        />
      )}

      {currentState === 'results' && (sessionData || sessionDataRef.current) && (
        <InterviewResults
          sessionData={sessionData || sessionDataRef.current}
          onBack={handleBackToDashboard}
        />
      )}
    </>
  );
};

export default PlatformContainer;

