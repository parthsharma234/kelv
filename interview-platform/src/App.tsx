import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { InterviewProvider } from './contexts/InterviewContext';
import SetupFlow from './components/SetupFlow';
import InterviewRoom from './components/InterviewRoom';
import Results from './components/Results';

function App() {
  return (
    <InterviewProvider>
      <Router>
        <div className="min-h-screen bg-dark-900">
          <Routes>
            <Route path="/" element={<SetupFlow />} />
            <Route path="/interview" element={<InterviewRoom />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </div>
      </Router>
    </InterviewProvider>
  );
}

export default App;