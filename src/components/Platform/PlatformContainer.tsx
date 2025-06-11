import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import PlatformDashboard from './PlatformDashboard';
import { SetupFlow } from './SetupFlow';
import { InterviewSession } from './InterviewSession';
import InterviewResults from './InterviewResults';
import { InterviewSetup } from '../../types/interview';

type PlatformState = 'dashboard' | 'setup' | 'interview' | 'results';

const PlatformContainer: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentState, setCurrentState] = useState<PlatformState>('dashboard');
  const [interviewSetup, setInterviewSetup] = useState<InterviewSetup | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);

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
    </>
  );
};

export default PlatformContainer;