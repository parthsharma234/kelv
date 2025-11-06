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
import RealtimeInterviewSession from './RealtimeInterviewSession';
import InterviewProcessing from './InterviewProcessing';
import { InterviewSetup } from '../../types/interview';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import CustomDemoInterview from './CustomDemoInterview';
// Enhanced metric detail component with debug logging
const InterviewMetricDetail = ({ metric, sessionData, onBack }: { metric: string, sessionData: any, onBack: () => void }) => {
  console.log('=== InterviewMetricDetail RENDERED ===');
  console.log('Metric:', metric);
  console.log('SessionData:', sessionData);

  const responses = sessionData?.responses || [];
  const questions = sessionData?.questions || [];
  const transcript = sessionData?.transcript || [];

  console.log('Responses count:', responses.length);
  console.log('Questions count:', questions.length);
  console.log('Transcript count:', transcript.length);

  // Filter responses that have this metric
  const relevantResponses = responses.filter((r: any) => {
    const hasMetric = r.analysis?.[metric] !== undefined;
    console.log(`Response for Q${r.questionId} has ${metric}:`, hasMetric, r.analysis?.[metric]);
    return hasMetric;
  });

  console.log('Relevant responses count:', relevantResponses.length);

  return (
    <div className="min-h-screen bg-dark-900 pt-24 pb-16 px-4">
      {/* BRIGHT DEBUG BANNER */}
      <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-4 z-50 font-bold text-center">
        DEBUG: Component is rendering! Metric={metric} | Total Responses={responses.length} | Relevant={relevantResponses.length}
      </div>

      <div className="container max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="mb-6 px-6 py-3 bg-dark-800 hover:bg-dark-700 text-white rounded-xl transition-all flex items-center gap-2 font-semibold"
        >
          ← Back to Results
        </button>

        {/* Header */}
        <h1 className="text-5xl font-bold text-white mb-3 capitalize">
          {metric.replace(/_/g, ' ')} Analysis
        </h1>
        <p className="text-gray-400 text-lg mb-12">
          Deep dive into your {metric.replace(/_/g, ' ').toLowerCase()} performance across all questions.
        </p>

        {/* Question-by-question breakdown */}
        {relevantResponses.length > 0 ? (
          <div className="space-y-6 mb-12">
            {relevantResponses.map((r: any, idx: number) => {
              const q = questions.find((q: any) => q.id === r.questionId);
              const score = r.analysis?.[metric];
              const feedback = r.analysis?.feedback || 'No feedback available';

              return (
                <div
                  key={r.questionId || idx}
                  className="bg-dark-800/60 backdrop-blur-xl rounded-2xl p-6 border border-dark-700/50 hover:border-orange-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="text-orange-400 font-semibold text-sm mb-2">Question {idx + 1}</div>
                      <div className="text-white text-lg font-medium mb-3">{q?.text || r.question}</div>
                    </div>
                    <div className="ml-4 flex flex-col items-center">
                      <div className="text-3xl font-bold text-white mb-1">{score}</div>
                      <div className="text-xs text-gray-500">/ 10</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                      <div className="text-blue-400 text-sm font-semibold mb-2">Your Response</div>
                      <div className="text-gray-300">{r.response || 'No response recorded'}</div>
                    </div>

                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                      <div className="text-orange-400 text-sm font-semibold mb-2">AI Feedback</div>
                      <div className="text-gray-300">{feedback}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-dark-800/50 rounded-2xl p-12 border border-dark-700/50 text-center mb-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-semibold text-white mb-3">No Data Available</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              This metric wasn't tracked for your responses. Try starting a new interview with voice mode enabled for comprehensive analytics.
            </p>
          </div>
        )}

        {/* Full Transcript Section */}
        {transcript.length > 0 && (
          <div className="bg-dark-800/60 backdrop-blur-xl rounded-2xl p-6 border border-dark-700/50">
            <h2 className="text-2xl font-bold text-white mb-6">Full Transcript</h2>
            <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
              {transcript.map((chunk: any, idx: number) => (
                <div
                  key={chunk.id || idx}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    chunk.speaker === 'user' ? 'bg-blue-500/10' : 'bg-orange-500/10'
                  }`}
                >
                  <span className={`font-bold text-sm ${
                    chunk.speaker === 'user' ? 'text-blue-400' : 'text-orange-400'
                  }`}>
                    {chunk.speaker === 'user' ? 'You' : 'AI'}:
                  </span>
                  <span className="text-gray-200 flex-1">{chunk.text}</span>
                  {chunk.timestamp && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(chunk.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

type PlatformState = 'dashboard' | 'setup' | 'interview' | 'results' | 'focused-selection' | 'focused-interview' | 'focused-results' | 'view-results' | 'view-focused-results' | 'realtime-interview' | 'realtime-focused-interview' | 'processing' | 'processing-focused' | 'view-metric-detail' | 'custom-demo-interview';

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
    const isFullScreen = currentState === 'realtime-interview' ||
                        currentState === 'realtime-focused-interview';

    if (onFullScreenChange) {
      onFullScreenChange(isFullScreen);
    }
  }, [currentState, onFullScreenChange]);

  // Effect for loading interview data when viewing results - moved to top level
  React.useEffect(() => {
    if ((currentState === 'view-results' || currentState === 'view-focused-results') && viewingInterviewId) {
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
      // If focused type is already selected (from dashboard), skip selection screen
      if (focusedInterviewType) {
        // Go directly to the interview based on mode
        if (setup.interviewMode === 'voice') {
          setCurrentState('realtime-focused-interview');
        } else {
          setCurrentState('focused-interview');
        }
      } else {
        // No type selected yet, show selection screen
        setCurrentState('focused-selection');
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

  const handleInterviewComplete = React.useCallback((data: any) => {
    if (!data) {
      console.error('❌ handleInterviewComplete: Received null/undefined data');
      return;
    }

    // Store session data in ref to ensure it's available immediately
    sessionDataRef.current = data;

    // Update React state - batched update
    setSessionData(data);

    // Use requestAnimationFrame to ensure DOM is ready before transition
    requestAnimationFrame(() => {
      setCurrentState('processing');
      scrollToTop();
    });
  }, []);

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
  };  const handleViewInterviewResults = (interviewId: string, interviewType?: string | null) => {
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
      
      {currentState === 'results' && (sessionData || sessionDataRef.current) && (
        <InterviewResults
          sessionData={sessionData || sessionDataRef.current}
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