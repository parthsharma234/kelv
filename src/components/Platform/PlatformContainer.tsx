import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import PlatformDashboard from './PlatformDashboard';
import { SetupFlow } from './SetupFlow';
import InterviewSession from './InterviewSession';
import InterviewResults from './InterviewResults';
import FocusedInterviewSelection from './FocusedInterviewSelection';
import FocusedInterview from './FocusedInterview';
import FocusedInterviewResults from './FocusedInterviewResults';
import CollegeSetupFlow from './CollegeSetupFlow';
import CollegeInterview from './CollegeInterview';
import CollegeInterviewResults from './CollegeInterviewResults';
import RealtimeInterviewSession from './RealtimeInterviewSession';
import InterviewProcessing from './InterviewProcessing';
import { InterviewSetup, CollegeInterviewSetup } from '../../types/interview';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import HardcodedInterviewSession from './HardcodedInterviewSession';

type PlatformState = 'dashboard' | 'setup' | 'interview' | 'results' | 'focused-selection' | 'focused-interview' | 'focused-results' | 'view-results' | 'view-focused-results' | 'view-college-results' | 'college-setup' | 'college-interview' | 'college-results' | 'realtime-interview' | 'realtime-focused-interview' | 'realtime-college-interview' | 'processing' | 'processing-focused' | 'processing-college' | 'hardcoded-interview';

interface PlatformContainerProps {
  onFullScreenChange?: (isFullScreen: boolean) => void;
}

const PlatformContainer: React.FC<PlatformContainerProps> = ({ onFullScreenChange }) => {
  const { user, loading } = useAuth();
  useScrollToTop(); // Use the hook to handle scroll to top on route changes
  const [currentState, setCurrentState] = useState<PlatformState>('dashboard');
  const [dashboardKey, setDashboardKey] = useState(0); // Add key to force dashboard refresh
  const [interviewSetup, setInterviewSetup] = useState<InterviewSetup | CollegeInterviewSetup | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [focusedInterviewType, setFocusedInterviewType] = useState<string>('');
  const [isFocusedFlow, setIsFocusedFlow] = useState(false);
  const [isCollegeFlow, setIsCollegeFlow] = useState(false);
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
                        currentState === 'realtime-focused-interview' || 
                        currentState === 'realtime-college-interview' ||
                        currentState === 'hardcoded-interview';
    
    if (onFullScreenChange) {
      onFullScreenChange(isFullScreen);
    }
  }, [currentState, onFullScreenChange]);

  // Effect for loading interview data when viewing results - moved to top level
  React.useEffect(() => {
    if ((currentState === 'view-results' || currentState === 'view-focused-results' || currentState === 'view-college-results') && viewingInterviewId) {
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

  const handleStartRealtimeInterview = (type: 'standard' | 'focused' | 'college', focusedType?: string) => {
    // Route to appropriate setup flow first
    if (type === 'college') {
      setIsCollegeFlow(true);
      setIsFocusedFlow(false);
      setCurrentState('college-setup');
    } else if (type === 'focused') {
      setIsFocusedFlow(true);
      setIsCollegeFlow(false);
      if (focusedType) {
        setFocusedInterviewType(focusedType);
      }
      // Go to setup first, then selection will be handled in handleSetupComplete
      setCurrentState('setup');
    } else {
      // Standard interview - go to setup
      setIsFocusedFlow(false);
      setIsCollegeFlow(false);
      setCurrentState('setup');
    }
    
    scrollToTop();
  };  const handleSetupComplete = (setup: InterviewSetup | CollegeInterviewSetup) => {
    setInterviewSetup(setup);
    
    if (isFocusedFlow) {
      setCurrentState('focused-selection');
    } else if (isCollegeFlow) {
      // For college interviews, check interview mode
      if (setup.interviewMode === 'voice') {
        setCurrentState('realtime-college-interview');
      } else {
        setCurrentState('college-interview');
      }
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
    setIsCollegeFlow(false);
    setDashboardKey(prev => prev + 1); // Force dashboard refresh
    if (onFullScreenChange) onFullScreenChange(false);
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
    setIsCollegeFlow(false);
    setCurrentState('setup');
    scrollToTop();
  };
  const handleStartNewFocusedInterview = (type: string) => {
    setFocusedInterviewType(type);
    setSessionData(null);
    setCurrentState('focused-interview');
    scrollToTop();
  };  const handleCollegeSetupComplete = (setup: any) => {
    // Store the college setup and move to college interview
    setInterviewSetup(setup as InterviewSetup);
    setCurrentState('college-interview');
    scrollToTop();
  };

  const handleCollegeInterviewComplete = (data: any) => {
    setSessionData(data);
    setCurrentState('processing-college');
    scrollToTop();
  };

  const handleStartNewCollegeInterview = () => {
    setInterviewSetup(null);
    setSessionData(null);
    setCurrentState('college-setup');
    scrollToTop();
  };  const handleViewInterviewResults = (interviewId: string, interviewType?: string | null) => {
    setViewingInterviewId(interviewId);
    if (interviewType === 'college') {
      // It's a college interview - route to college results
      setCurrentState('view-college-results');
    } else if (interviewType) {
      // It's a focused interview - set the type and route to focused results
      setFocusedInterviewType(interviewType);
      setCurrentState('view-focused-results');
    } else {
      // It's a regular interview - route to regular results
      setCurrentState('view-results');
    }
    scrollToTop();
  };  // Handle viewing focused interview results
  if (currentState === 'view-focused-results' && viewingInterviewId) {
    if (!viewingSessionData) {
      return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading focused interview results...</p>
          </div>
        </div>
      );
    }
    return (
      <FocusedInterviewResults
        sessionData={viewingSessionData}
        onBackToDashboard={handleBackToDashboard}
        onStartNewFocusedInterview={handleStartNewFocusedInterview}
      />
    );
  }
  // Handle viewing college interview results
  if (currentState === 'view-college-results' && viewingInterviewId) {
    if (!viewingSessionData) {
      return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading college interview results...</p>
            <p className="text-gray-500 text-sm mt-2">Interview ID: {viewingInterviewId}</p>
            <button
              onClick={handleBackToDashboard}
              className="mt-4 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return (
      <CollegeInterviewResults
        sessionData={viewingSessionData}
        onBackToDashboard={handleBackToDashboard}
        onStartNewCollegeInterview={handleStartNewCollegeInterview}
      />
    );
  }

  // Handle viewing regular interview results
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
      <InterviewResults
        sessionData={viewingSessionData}
        onBackToDashboard={handleBackToDashboard}
        onStartNewInterview={handleStartNewInterview}
      />
    );
  }

  const handleStartHardcodedInterview = () => {
    setCurrentState('hardcoded-interview');
    if (onFullScreenChange) onFullScreenChange(true);
    scrollToTop();
  };

  return (
    <>
      {currentState === 'dashboard' && (
        <PlatformDashboard 
          key={dashboardKey}
          onStartRealtimeInterview={handleStartRealtimeInterview}
          onViewInterviewResults={handleViewInterviewResults}
          onStartHardcodedInterview={handleStartHardcodedInterview}
        />
      )}
        {currentState === 'setup' && (
        <SetupFlow 
          onComplete={handleSetupComplete}
          onBack={handleBackToDashboard}
        />
      )}
        {currentState === 'college-setup' && (
        <CollegeSetupFlow 
          onComplete={handleCollegeSetupComplete}
          onBack={handleBackToDashboard}
        />
      )}

      {currentState === 'college-interview' && interviewSetup && (
        <CollegeInterview 
          setup={interviewSetup as any}
          onComplete={handleCollegeInterviewComplete}
          onBack={handleBackToDashboard}
        />
      )}

      {currentState === 'college-results' && sessionData && (
        <CollegeInterviewResults 
          sessionData={sessionData}
          onBackToDashboard={handleBackToDashboard}
          onStartNewCollegeInterview={handleStartNewCollegeInterview}
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
        <InterviewResults
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
        <FocusedInterviewResults
          sessionData={sessionData}
          onBackToDashboard={handleBackToDashboard}
          onStartNewFocusedInterview={handleStartNewFocusedInterview}
        />
      )}

      {/* Realtime Interview Components */}
      {currentState === 'realtime-interview' && interviewSetup && (
        <RealtimeInterviewSession
          setup={interviewSetup as InterviewSetup}
          interviewType="standard"
          onComplete={handleInterviewComplete}
          onBack={handleBackToDashboard}
        />
      )}

      {currentState === 'realtime-focused-interview' && interviewSetup && focusedInterviewType && (
        <RealtimeInterviewSession
          setup={interviewSetup as InterviewSetup}
          interviewType={focusedInterviewType}
          onComplete={handleFocusedInterviewComplete}
          onBack={handleBackToDashboard}
        />
      )}

      {currentState === 'realtime-college-interview' && interviewSetup && (
        <RealtimeInterviewSession
          setup={interviewSetup as any}
          interviewType="college"
          onComplete={handleCollegeInterviewComplete}
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

      {currentState === 'processing-college' && (
        <InterviewProcessing
          onComplete={() => setCurrentState('college-results')}
        />
      )}

      {currentState === 'hardcoded-interview' && (
        <HardcodedInterviewSession onBack={handleBackToDashboard} />
      )}
    </>
  );
};

export default PlatformContainer;