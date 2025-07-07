import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import PlatformDashboard from './PlatformDashboard';
import { SetupFlow } from './SetupFlow';
<<<<<<< Updated upstream
import { InterviewSession } from './InterviewSession';
import InterviewResults from './InterviewResults';
=======
import FocusedInterviewSelection from './FocusedInterviewSelection';
import FocusedInterviewResults from './FocusedInterviewResults';
import CollegeSetupFlow from './CollegeSetupFlow';
import CollegeInterviewResults from './CollegeInterviewResults';
import InterviewResults from './InterviewResults';
import RealtimeInterviewSession from './RealtimeInterviewSession'; // Import the new component
>>>>>>> Stashed changes
import { InterviewSetup } from '../../types/interview';

type PlatformState = 'dashboard' | 'setup' | 'interview' | 'results';

interface PlatformContainerProps {
  onInterviewStateChange?: (isInterviewActive: boolean) => void;
}

const PlatformContainer: React.FC<PlatformContainerProps> = ({ onInterviewStateChange }) => {
  const { user, loading } = useAuth();
  const [currentState, setCurrentState] = useState<PlatformState>('dashboard');
  const [interviewSetup, setInterviewSetup] = useState<InterviewSetup | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
<<<<<<< Updated upstream
=======
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
  // Track interview state changes and notify parent component
  React.useEffect(() => {
    const isInterviewActive = currentState === 'interview' || 
                            currentState === 'college-interview' || 
                            currentState === 'focused-interview';
    onInterviewStateChange?.(isInterviewActive);
  }, [currentState, onInterviewStateChange]);

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
>>>>>>> Stashed changes

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

  const handleStartInterview = () => {
    setCurrentState('setup');
  };

<<<<<<< Updated upstream
=======
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
  };

>>>>>>> Stashed changes
  const handleSetupComplete = (setup: InterviewSetup) => {
    setInterviewSetup(setup);
    setCurrentState('interview');
  };

  const handleInterviewComplete = (data: any) => {
    setSessionData(data);
    setCurrentState('results');
  };

  const handleBackToDashboard = () => {
    setCurrentState('dashboard');
    setInterviewSetup(null);
    setSessionData(null);
  };

  const handleBackToSetup = () => {
    setCurrentState('setup');
  };

  const handleStartNewInterview = () => {
    setInterviewSetup(null);
    setSessionData(null);
    setCurrentState('setup');
  };

  return (
    <>
      {currentState === 'dashboard' && (
        <PlatformDashboard onStartInterview={handleStartInterview} />
      )}
<<<<<<< Updated upstream
      
=======

>>>>>>> Stashed changes
      {currentState === 'setup' && (
        <SetupFlow 
          onComplete={handleSetupComplete}
          onBack={handleBackToDashboard}
        />
      )}
<<<<<<< Updated upstream
=======
        {currentState === 'college-setup' && (
        <CollegeSetupFlow 
          onComplete={handleCollegeSetupComplete}
          onBack={handleBackToDashboard}
        />
      )}

      {currentState === 'college-interview' && interviewSetup && (
        <RealtimeInterviewSession 
          interviewType="college"
          setup={interviewSetup}
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
>>>>>>> Stashed changes
      
      {currentState === 'interview' && interviewSetup && (
        <RealtimeInterviewSession 
          interviewType="standard"
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
<<<<<<< Updated upstream
=======

      {currentState === 'focused-selection' && interviewSetup && (
        <FocusedInterviewSelection
          setup={interviewSetup}
          onSelectType={handleFocusedTypeSelect}
          onBack={handleBackToDashboard}
        />
      )}

      {currentState === 'focused-interview' && interviewSetup && focusedInterviewType && (
        <RealtimeInterviewSession
          interviewType="focused"
          focusedSubtype={focusedInterviewType}
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
>>>>>>> Stashed changes
    </>
  );
};

export default PlatformContainer;