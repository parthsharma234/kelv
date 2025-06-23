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
import { InterviewSetup } from '../../types/interview';

type PlatformState = 'dashboard' | 'setup' | 'interview' | 'results' | 'focused-selection' | 'focused-interview' | 'focused-results' | 'view-results' | 'view-focused-results' | 'college-setup' | 'college-interview' | 'college-results';

const PlatformContainer: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentState, setCurrentState] = useState<PlatformState>('dashboard');  const [interviewSetup, setInterviewSetup] = useState<InterviewSetup | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [focusedInterviewType, setFocusedInterviewType] = useState<string>('');
  const [isFocusedFlow, setIsFocusedFlow] = useState(false);
  const [isCollegeFlow, setIsCollegeFlow] = useState(false);
  const [viewingInterviewId, setViewingInterviewId] = useState<string>('');
  
  // State for viewing interview results - moved to top level to avoid conditional hooks
  const [viewingSessionData, setViewingSessionData] = useState<any>(null);
  
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
  }
  const handleStartInterview = () => {
    setIsFocusedFlow(false);
    setIsCollegeFlow(false);
    setCurrentState('setup');
  };

  const handleStartFocusedInterview = () => {
    setIsFocusedFlow(true);
    setIsCollegeFlow(false);
    setCurrentState('setup');
  };

  const handleStartCollegeInterview = () => {
    setIsFocusedFlow(false);
    setIsCollegeFlow(true);
    setCurrentState('college-setup');
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
    setIsCollegeFlow(false);
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
    setIsCollegeFlow(false);
    setCurrentState('setup');
  };
  const handleStartNewFocusedInterview = (type: string) => {
    setFocusedInterviewType(type);
    setSessionData(null);
    setCurrentState('focused-interview');
  };
  const handleCollegeSetupComplete = (setup: any) => {
    // For now, we'll just go back to dashboard with a comprehensive message
    // In the future, this would navigate to the actual college interview
    console.log('College setup completed:', setup);
    
    const setupDetails = `
College Interview Setup Complete!

Institution Type: ${setup.schoolType}
Program Area: ${setup.program}
Specific Major: ${setup.major}
Interview Mode: ${setup.interviewMode}

This feature is currently in testing phase for FBLA.
The system has captured your detailed preferences for:
- ${getSchoolTypeDescription(setup.schoolType)}
- Major focus in ${setup.major}
- Interview format: ${setup.interviewMode === 'voice' ? 'Voice-based conversation' : 'Text-based responses'}

Coming soon: Personalized college admission interview practice!`;
    
    alert(setupDetails);
    handleBackToDashboard();
  };

  const getSchoolTypeDescription = (schoolType: string) => {
    const descriptions = {
      'ivy-league': 'Ivy League/Elite University preparation',
      'private': 'Private University admission',
      'public': 'Public University admission',
      'liberal-arts': 'Liberal Arts College admission',
      'community': 'Community College admission'
    };
    return descriptions[schoolType as keyof typeof descriptions] || schoolType;
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