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
import { InterviewSetup } from '../../types/interview';
import { useScrollToTop } from '../../hooks/useScrollToTop';

type PlatformState = 'dashboard' | 'setup' | 'interview' | 'results' | 'focused-selection' | 'focused-interview' | 'focused-results' | 'view-results' | 'view-focused-results' | 'college-setup' | 'college-interview' | 'college-results';

const PlatformContainer: React.FC = () => {
  const { user, loading } = useAuth();
  useScrollToTop(); // Use the hook to handle scroll to top on route changes
  const [currentState, setCurrentState] = useState<PlatformState>('dashboard');  const [interviewSetup, setInterviewSetup] = useState<InterviewSetup | null>(null);
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
  
  // Effect for loading interview data when viewing results - moved to top level
  React.useEffect(() => {
    if ((currentState === 'view-results' || currentState === 'view-focused-results') && viewingInterviewId) {
      let isMounted = true;
      setViewingSessionData(null); // Reset data when starting to load
      
      import('../../utils/supabase-interview').then(({ getInterviewById }) => {
        getInterviewById(viewingInterviewId).then((data: any) => {
          if (isMounted) {
            setViewingSessionData(data);
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
  }  const handleStartInterview = () => {
    setIsFocusedFlow(false);
    setIsCollegeFlow(false);
    setCurrentState('setup');
    scrollToTop();
  };

  const handleStartFocusedInterview = () => {
    setIsFocusedFlow(true);
    setIsCollegeFlow(false);
    setCurrentState('setup');
    scrollToTop();
  };

  const handleStartCollegeInterview = () => {
    setIsFocusedFlow(false);
    setIsCollegeFlow(true);
    setCurrentState('college-setup');
    scrollToTop();
  };  const handleSetupComplete = (setup: InterviewSetup) => {
    setInterviewSetup(setup);
    if (isFocusedFlow) {
      setCurrentState('focused-selection');
    } else if (isCollegeFlow) {
      setCurrentState('college-interview');
    } else {
      setCurrentState('interview');
    }
    scrollToTop();
  };

  const handleInterviewComplete = (data: any) => {
    setSessionData(data);
    setCurrentState('results');
    scrollToTop();
  };

  const handleFocusedTypeSelect = (type: string) => {
    setFocusedInterviewType(type);
    setCurrentState('focused-interview');
    scrollToTop();
  };

  const handleFocusedInterviewComplete = (data: any) => {
    setSessionData(data);
    setCurrentState('focused-results');
    scrollToTop();
  };  const handleBackToDashboard = () => {
    setCurrentState('dashboard');
    setInterviewSetup(null);
    setSessionData(null);
    setFocusedInterviewType('');
    setIsFocusedFlow(false);
    setIsCollegeFlow(false);
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
    setCurrentState('college-results');
    scrollToTop();
  };

  const handleStartNewCollegeInterview = () => {
    setInterviewSetup(null);
    setSessionData(null);
    setCurrentState('college-setup');
    scrollToTop();
  };
  const handleViewInterviewResults = (interviewId: string, interviewType?: string | null) => {
    setViewingInterviewId(interviewId);
    if (interviewType) {
      // It's a focused interview - set the type and route to focused results
      setFocusedInterviewType(interviewType);
      setCurrentState('view-focused-results');
    } else {
      // It's a regular interview - route to regular results
      setCurrentState('view-results');
    }
    scrollToTop();
  };
  // Handle viewing focused interview results
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

  return (
    <>      {currentState === 'dashboard' && (
        <PlatformDashboard 
          onStartInterview={handleStartInterview}
          onStartFocusedInterview={handleStartFocusedInterview}
          onStartCollegeInterview={handleStartCollegeInterview}
          onViewInterviewResults={handleViewInterviewResults}
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
          setup={interviewSetup}
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
          setup={interviewSetup}
          onSelectType={handleFocusedTypeSelect}
          onBack={handleBackToDashboard}
        />
      )}

      {currentState === 'focused-interview' && interviewSetup && focusedInterviewType && (
        <FocusedInterview
          interviewType={focusedInterviewType as any}
          setup={interviewSetup}
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
    </>
  );
};

export default PlatformContainer;