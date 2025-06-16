import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Corrected path

interface PlatformProtectedRouteProps {
  children: React.ReactNode;
}

const PlatformProtectedRoute: React.FC<PlatformProtectedRouteProps> = ({ children }) => {
  const { user, loading, isPlatformEnabled } = useAuth();

  if (loading) {
    // You can customize this loading state as needed
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading platform access...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in but not platform enabled, redirect to access denied page
  if (!isPlatformEnabled) {
    return <Navigate to="/access-denied" replace />;
  }

  // If user is logged in and platform enabled, render children
  return <>{children}</>;
};

export default PlatformProtectedRoute; 