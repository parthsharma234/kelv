import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useScrollToTop } from './hooks/useScrollToTop';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Waitlist from './components/Waitlist';
import Footer from './components/Footer';
import LoginPage from './components/Auth/LoginPage';
import WaitlistSuccess from './components/WaitlistSuccess';
import PlatformContainer from './components/Platform/PlatformContainer';

const HomePage: React.FC = () => {
  useEffect(() => {
    document.title = 'Kelv AI - AI-Powered Interview Preparation';
  }, []);

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Waitlist />
      </main>
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
            <ProtectedRoute>
              <div className="min-h-screen bg-dark-900 text-white">
                <Navbar />
                <PlatformContainer />
              </div>
            </ProtectedRoute>
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