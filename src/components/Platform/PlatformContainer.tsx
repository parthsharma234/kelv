import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import PlatformDashboard from './PlatformDashboard';
import VapiInterviewSession from './VapiInterviewSession';
import InterviewProcessing from './InterviewProcessing';
import InterviewResults from './InterviewResults';
import { useScrollToTop } from '../../hooks/useScrollToTop';

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
          onViewInterviewResults={() => {
            // TODO: Implement interview results viewing
            console.log('View interview results - to be implemented');
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
          onComplete={(results) => {
            // Merge processed metrics into session data
            const finalData = { ...(sessionData || sessionDataRef.current), ...results };
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

