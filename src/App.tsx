import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useScrollToTop } from './hooks/useScrollToTop';
import Navbar from './components/Navbar';
import ScrollNarrativeHomepage from './components/ScrollNarrativeHomepage';
import Footer from './components/Footer';
import LoginPage from './components/Auth/LoginPage';
import WaitlistSuccess from './components/WaitlistSuccess';
import PlatformContainer from './components/Platform/PlatformContainer';
import AccessDenied from './components/AccessDenied';
import InterviewResultsTest from './components/Platform/InterviewResultsTest';

const HomePage: React.FC = () => {
  useEffect(() => {
    document.title = 'Kelv AI - AI-Powered Interview Preparation';
  }, []);

  return (
    <div className="min-h-screen text-white">
      <Navbar />
      <ScrollNarrativeHomepage />
      <Footer />
    </div>
  );
};

const PlatformRoute: React.FC = () => {
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  return (
    <div className="min-h-screen text-white">
      {!isFullScreen && <Navbar />}
      <PlatformContainer onFullScreenChange={setIsFullScreen} />
    </div>
  );
};

const ScrollToTopWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useScrollToTop();
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <ScrollToTopWrapper>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/platform"
          element={<PlatformRoute />}
        />
        <Route
          path="/waitlist-success"
          element={<WaitlistSuccess />}
        />
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="/dev/results" element={<InterviewResultsTest />} />
      </Routes>
    </ScrollToTopWrapper>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
