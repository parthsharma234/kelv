import React, { useState } from 'react';
import { SetupFlow } from './components/SetupFlow';
import { InterviewSession } from './components/InterviewSession';
import { InterviewSetup } from './types/interview';

type AppState = 'setup' | 'interview';

function App() {
  const [currentState, setCurrentState] = useState<AppState>('setup');
  const [interviewSetup, setInterviewSetup] = useState<InterviewSetup | null>(null);

  const handleSetupComplete = (setup: InterviewSetup) => {
    setInterviewSetup(setup);
    setCurrentState('interview');
  };

  const handleInterviewComplete = () => {
    setCurrentState('setup');
    setInterviewSetup(null);
  };

  const handleEndCall = () => {
    setCurrentState('setup');
    setInterviewSetup(null);
  };

  return (
    <div className="min-h-screen bg-black">
      {currentState === 'setup' && (
        <SetupFlow onComplete={handleSetupComplete} />
      )}
      
      {currentState === 'interview' && interviewSetup && (
        <InterviewSession 
          setup={interviewSetup}
          onComplete={handleInterviewComplete}
          onEndCall={handleEndCall}
        />
      )}
    </div>
  );
}

export default App;