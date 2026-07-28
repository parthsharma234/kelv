import React from 'react';
interface PlatformProtectedRouteProps {
  children: React.ReactNode;
}

const PlatformProtectedRoute: React.FC<PlatformProtectedRouteProps> = ({ children }) => {
  return <>{children}</>;
};

export default PlatformProtectedRoute;
