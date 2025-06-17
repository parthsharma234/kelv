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
import { InterviewSetup } from '../../types/interview';

type PlatformState = 'dashboard' | 'setup' | 'interview' | 'results' | 'focused-selection' | 'focused-interview' | 'focused-results';

const PlatformContainer: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentState, setCurrentState] = useState<PlatformState>('dashboard');
  const [interviewSetup, setInterviewSetup] = useState<InterviewSetup | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [focusedInterviewType, setFocusedInterviewType] = useState<string>('');
  const [isFocusedFlow, setIsFocusedFlow] = useState(false);

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
    setIsFocusedFlow(false);
    setCurrentState('setup');
  };

  const handleStartFocusedInterview = () => {
    setIsFocusedFlow(true);
    setCurrentState('setup');
  };

  const handleSetupComplete = (setup: InterviewSetup) => {
    setInterviewSetup(setup);
    if (isFocusedFlow) {
      setCurrentState('focused-selection');
    } else {
      setCurrentState('interview');
    }
  };

  const handleInterviewComplete = (data: any) => {
    setSessionData(data);
    setCurrentState('results');
  };

  const handleFocusedTypeSelect = (type: string) => {
    setFocusedInterviewType(type);
    setCurrentState('focused-interview');
  };

  const handleFocusedInterviewComplete = (data: any) => {
    setSessionData(data);
    setCurrentState('focused-results');
  };

  const handleBackToDashboard = () => {
    setCurrentState('dashboard');
    setInterviewSetup(null);
    setSessionData(null);
    setFocusedInterviewType('');
    setIsFocusedFlow(false);
  };

  const handleBackToSetup = () => {
    setCurrentState('setup');
  };

  const handleBackToFocusedSelection = () => {
    setCurrentState('focused-selection');
  };

  const handleStartNewInterview = () => {
    setInterviewSetup(null);
    setSessionData(null);
    setIsFocusedFlow(false);
    setCurrentState('setup');
  };

  const handleStartNewFocusedInterview = (type: string) => {
    setFocusedInterviewType(type);
    setSessionData(null);
    setCurrentState('focused-interview');
  };

  return (
    <>
      {currentState === 'dashboard' && (
        <PlatformDashboard 
          onStartInterview={handleStartInterview}
          onStartFocusedInterview={handleStartFocusedInterview}
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