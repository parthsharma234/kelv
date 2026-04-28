import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useScrollToTop } from './hooks/useScrollToTop';
import Navbar from './components/Navbar';
import ScrollNarrativeHomepage from './components/ScrollNarrativeHomepage';
import Footer from './components/Footer';
import LoginPage from './components/Auth/LoginPage';
import WaitlistSuccess from './components/WaitlistSuccess';
import PlatformContainer from './components/Platform/PlatformContainer';
import PlatformProtectedRoute from './components/PlatformProtectedRoute';
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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

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

  return <>{children}</>;
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
          element={
            <PlatformProtectedRoute>
              <PlatformRoute />
            </PlatformProtectedRoute>
          }
        />
        <Route
          path="/waitlist-success"
          element={
            <ProtectedRoute>
              <WaitlistSuccess />
            </ProtectedRoute>
          }
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