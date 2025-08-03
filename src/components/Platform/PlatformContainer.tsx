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
import FeedbackPage from './FeedbackPage';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import CustomDemoInterview from './CustomDemoInterview';
// Temporary metric detail component
const InterviewMetricDetail = ({ metric, sessionData, onBack }: { metric: string, sessionData: any, onBack: () => void }) => {
  // Find relevant responses and scores for the metric
  const responses = sessionData.responses || [];
  const questions = sessionData.questions || [];
  const transcript = sessionData.transcript || [];
  return (
    <div className="min-h-screen bg-dark-900 pt-24 pb-16">
      <div className="container max-w-3xl mx-auto px-4">
        <button className="mb-6 px-4 py-2 bg-gray-700 text-white rounded" onClick={onBack}>Back</button>
        <h1 className="text-3xl font-bold text-white mb-4 capitalize">{metric.replace('_', ' ')} Details</h1>
        <div className="space-y-6 mb-12">
          {responses.map((r: any, idx: number) => {
            const q = questions.find((q: any) => q.id === r.questionId);
            const score = r.analysis?.[metric];
            if (score === undefined) return null;
            return (
              <div key={r.questionId || idx} className="bg-dark-800 rounded p-4 border border-dark-700">
                <div className="mb-2 text-orange-400 font-semibold">Q{idx + 1}: {q?.text || r.question}</div>
                <div className="mb-1 text-white">Score: <span className="font-bold">{score}/10</span></div>
                <div className="mb-1 text-gray-300">Your Response: {r.response}</div>
                <div className="text-gray-400">AI Feedback: {r.analysis?.feedback}</div>
              </div>
            );
          })}
        </div>
        {/* Full Transcript Section */}
        <div className="bg-dark-800 rounded p-4 border border-dark-700">
          <h2 className="text-2xl font-semibold text-white mb-4">Full Transcript</h2>
          <div className="space-y-2">
            {transcript.length === 0 && <div className="text-gray-400">No transcript available.</div>}
            {transcript.map((chunk: any, idx: number) => (
              <div key={chunk.id || idx} className="flex items-start gap-3">
                <span className={`font-bold ${chunk.speaker === 'user' ? 'text-blue-400' : 'text-orange-400'}`}>{chunk.speaker === 'user' ? 'You' : 'AI'}:</span>
                <span className="text-gray-200">{chunk.text}</span>
                <span className="text-xs text-gray-500 ml-auto">{chunk.timestamp ? new Date(chunk.timestamp).toLocaleTimeString() : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

type PlatformState = 'dashboard' | 'setup' | 'interview' | 'focused-selection' | 'focused-interview' | 'realtime-interview' | 'realtime-focused-interview' | 'processing' | 'processing-focused' | 'view-metric-detail' | 'custom-demo-interview' | 'feedback';

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
  
  // State for viewing metric details
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  
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
    setCurrentState('feedback');
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
    setCurrentState('feedback');
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
  const handleViewInterviewResults = (interviewId: string) => {
    // This will be handled by a new feedback page logic
    console.log("Viewing results for interview: ", interviewId);
  };

  const handleMetricClick = (metric: string) => {
    setSelectedMetric(metric);
    setCurrentState('view-metric-detail');
    scrollToTop();
  };
  const handleBackFromMetricDetail = () => {
    setCurrentState('view-results');
    setSelectedMetric(null);
    scrollToTop();
  };

  if (currentState === 'view-metric-detail' && selectedMetric && sessionData) {
    return (
      <InterviewMetricDetail
        metric={selectedMetric}
        sessionData={sessionData}
        onBack={handleBackFromMetricDetail}
      />
    );
  }

  // Handler to launch the custom demo interview
  const handleStartCustomDemoInterview = () => {
    setCurrentState('custom-demo-interview');
    scrollToTop();
  };

  if (currentState === 'custom-demo-interview' && (
    <CustomDemoInterview onBack={handleBackToDashboard} />
  )) {
    return (
      <CustomDemoInterview onBack={handleBackToDashboard} />
    );
  }

  return (
    <>
      {currentState === 'dashboard' && (
        <>
          <PlatformDashboard 
            key={dashboardKey}
            onStartRealtimeInterview={handleStartRealtimeInterview}
            onViewInterviewResults={handleViewInterviewResults}
            onStartCustomDemoInterview={handleStartCustomDemoInterview}
          />
        </>
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
      
      {currentState === 'feedback' && sessionData && (
        <FeedbackPage
          sessionData={sessionData}
          onBackToDashboard={handleBackToDashboard}
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
          onComplete={() => setCurrentState('feedback')}
        />
      )}

      {currentState === 'processing-focused' && (
        <InterviewProcessing
          onComplete={() => setCurrentState('feedback')}
        />
      )}
    </>
  );
};

export default PlatformContainer;