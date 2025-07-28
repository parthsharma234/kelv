import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import PlatformDashboard from './PlatformDashboard';
import { SetupFlow } from './SetupFlow';
import InterviewSession from './InterviewSession';
import FocusedInterviewSelection from './FocusedInterviewSelection';
import FocusedInterview from './FocusedInterview';
import RealtimeInterviewSession from './RealtimeInterviewSession';
import InterviewProcessing from './InterviewProcessing';
import { InterviewSetup } from '../../types/interview';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import UnifiedInterviewResults from './UnifiedInterviewResults';

type PlatformState = 'dashboard' | 'setup' | 'interview' | 'results' | 'focused-selection' | 'focused-interview' | 'focused-results' | 'view-results' | 'realtime-interview' | 'realtime-focused-interview' | 'processing' | 'processing-focused';

interface PlatformContainerProps {
  onFullScreenChange?: (isFullScreen: boolean) => void;
}

const PlatformContainer: React.FC<PlatformContainerProps> = ({ onFullScreenChange }) => {
  const { user, loading } = useAuth();
  useScrollToTop(); // Use the hook to handle scroll to top on route changes
  const [currentState, setCurrentState] = useState<PlatformState>('dashboard');
  const [dashboardKey, setDashboardKey] = useState(0); // Add key to force dashboard refresh
  const [interviewSetup, setInterviewSetup] = useState<InterviewSetup | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [focusedInterviewType, setFocusedInterviewType] = useState<string>('');
  const [isFocusedFlow, setIsFocusedFlow] = useState(false);
  const [viewingInterviewId, setViewingInterviewId] = useState<string>('');
  
  // State for viewing interview results - moved to top level to avoid conditional hooks
  const [viewingSessionData, setViewingSessionData] = useState<any>(null);
  
  // Helper function to scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Notify parent about full-screen state changes
  React.useEffect(() => {
    const isFullScreen = currentState === 'realtime-interview' || 
                        currentState === 'realtime-focused-interview';
    
    if (onFullScreenChange) {
      onFullScreenChange(isFullScreen);
    }
  }, [currentState, onFullScreenChange]);

  // Effect for loading interview data when viewing results - moved to top level
  React.useEffect(() => {
    if (currentState === 'view-results' && viewingInterviewId) {
      let isMounted = true;
      setViewingSessionData(null); // Reset data when starting to load
      
      console.log('PlatformContainer: Loading interview data for ID:', viewingInterviewId, 'State:', currentState);
      
      import('../../utils/supabase-interview').then(({ getInterviewById }) => {
        getInterviewById(viewingInterviewId).then((data: any) => {
          console.log('PlatformContainer: Received interview data:', data);
          if (isMounted) {
            setViewingSessionData(data);
          }
        }).catch((error) => {
          console.error('PlatformContainer: Error loading interview data:', error);
          if (isMounted) {
            setViewingSessionData(null);
          }
        });
      });
      
      return () => { 
        isMounted = false; 
      };
    }
  }, [currentState, viewingInterviewId]);

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

  const handleStartRealtimeInterview = (type: 'standard' | 'focused', focusedType?: string) => {
    // Route to appropriate setup flow first
    if (type === 'focused') {
      setIsFocusedFlow(true);
      if (focusedType) {
        setFocusedInterviewType(focusedType);
      }
      // Go to setup first, then selection will be handled in handleSetupComplete
      setCurrentState('setup');
    } else {
      // Standard interview - go to setup
      setIsFocusedFlow(false);
      setCurrentState('setup');
    }
    
    scrollToTop();
  };  const handleSetupComplete = (setup: InterviewSetup) => {
    setInterviewSetup(setup);
    
    if (isFocusedFlow) {
      setCurrentState('focused-selection');
    } else {
      // For standard interviews, check interview mode
      if (setup.interviewMode === 'voice') {
        setCurrentState('realtime-interview');
      } else {
        setCurrentState('interview');
      }
    }
    scrollToTop();
  };

  const handleInterviewComplete = (data: any) => {
    setSessionData(data);
    setCurrentState('processing');
    scrollToTop();
  };

  const handleFocusedTypeSelect = (type: string) => {
    setFocusedInterviewType(type);
    
    // Route to realtime or traditional based on interview mode
    if (interviewSetup && interviewSetup.interviewMode === 'voice') {
      setCurrentState('realtime-focused-interview');
    } else {
      setCurrentState('focused-interview');
    }
    scrollToTop();
  };

  const handleFocusedInterviewComplete = (data: any) => {
    setSessionData(data);
    setCurrentState('processing-focused');
    scrollToTop();
  };  const handleBackToDashboard = () => {
    setCurrentState('dashboard');
    setInterviewSetup(null);
    setSessionData(null);
    setFocusedInterviewType('');
    setIsFocusedFlow(false);
    setDashboardKey(prev => prev + 1); // Force dashboard refresh
    scrollToTop();
  };

  const handleBackToSetup = () => {
    setCurrentState('setup');
    scrollToTop();
  };

  const handleBackToFocusedSelection = () => {
    setCurrentState('focused-selection');
    scrollToTop();
  };  const handleStartNewInterview = () => {
    setInterviewSetup(null);
    setSessionData(null);
    setIsFocusedFlow(false);
    setCurrentState('setup');
    scrollToTop();
  };
  const handleStartNewFocusedInterview = (type: string) => {
    setFocusedInterviewType(type);
    setSessionData(null);
    setCurrentState('focused-interview');
    scrollToTop();
  };
  const handleViewInterviewResults = (interviewId: string, interviewType?: string | null) => {
    setViewingInterviewId(interviewId);
    // All interview types now use the unified results component
    setCurrentState('view-results');
    scrollToTop();
  };  // Handle viewing interview results - unified for all types
  if (currentState === 'view-results' && viewingInterviewId) {
    if (!viewingSessionData) {
      return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading interview results...</p>
          </div>
        </div>
      );
    }
    return (
      <UnifiedInterviewResults
        sessionData={viewingSessionData}
        onBackToDashboard={handleBackToDashboard}
        onStartNewInterview={handleStartNewInterview}
      />
    );
  }

  return (
    <>
      {currentState === 'dashboard' && (
        <PlatformDashboard 
          key={dashboardKey}
          onStartRealtimeInterview={handleStartRealtimeInterview}
          onViewInterviewResults={handleViewInterviewResults}
        />
      )}
        {currentState === 'setup' && (
        <SetupFlow 
          onComplete={handleSetupComplete}
          onBack={handleBackToDashboard}
        />
      )}
      
      {currentState === 'interview' && interviewSetup && (
        <InterviewSession 
          setup={interviewSetup as InterviewSetup}
          onComplete={handleInterviewComplete}
          onBack={handleBackToSetup}
        />
      )}
      
      {currentState === 'results' && sessionData && (
        <UnifiedInterviewResults
          sessionData={sessionData}
          onBackToDashboard={handleBackToDashboard}
          onStartNewInterview={handleStartNewInterview}
        />
      )}

      {currentState === 'focused-selection' && interviewSetup && (
        <FocusedInterviewSelection
          setup={interviewSetup as InterviewSetup}
          onSelectType={handleFocusedTypeSelect}
          onBack={handleBackToDashboard}
        />
      )}

      {currentState === 'focused-interview' && interviewSetup && focusedInterviewType && (
        <FocusedInterview
          interviewType={focusedInterviewType as any}
          setup={interviewSetup as InterviewSetup}
          onComplete={handleFocusedInterviewComplete}
          onBack={handleBackToFocusedSelection}
        />
      )}

      {currentState === 'focused-results' && sessionData && (
        <UnifiedInterviewResults
          sessionData={sessionData}
          onBackToDashboard={handleBackToDashboard}
          onStartNewInterview={handleStartNewFocusedInterview}
        />
      )}

      {/* Realtime Interview Components */}
      {currentState === 'realtime-interview' && interviewSetup && (
        <RealtimeInterviewSession
          setup={interviewSetup as InterviewSetup}
          interviewType="standard"
          onComplete={handleInterviewComplete}
          onProcessingStart={() => { setCurrentState('processing'); scrollToTop(); }}
          onBack={handleBackToDashboard}
        />
      )}

      {currentState === 'realtime-focused-interview' && interviewSetup && focusedInterviewType && (
        <RealtimeInterviewSession
          setup={interviewSetup as InterviewSetup}
          interviewType={focusedInterviewType}
          onComplete={handleFocusedInterviewComplete}
          onProcessingStart={() => { setCurrentState('processing-focused'); scrollToTop(); }}
          onBack={handleBackToDashboard}
        />
      )}


      {currentState === 'processing' && (
        <InterviewProcessing
          onComplete={() => setCurrentState('results')}
        />
      )}

      {currentState === 'processing-focused' && (
        <InterviewProcessing
          onComplete={() => setCurrentState('focused-results')}
        />
      )}

    </>
  );
};

export default PlatformContainer;