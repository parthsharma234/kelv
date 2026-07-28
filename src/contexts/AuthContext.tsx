import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LOCAL_SESSION_KEY = 'kelv-local-session';

export interface LocalUser {
  id: string;
  email: string;
  created_at: string;
  user_metadata: {
    full_name: string;
  };
}

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ data: LocalUser; error: null }>;
  signIn: (email: string, password: string) => Promise<{ data: LocalUser; error: null }>;
  signOut: () => Promise<void>;
  isConfigured: true;
  isPlatformEnabled: true;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function createLocalUser(email: string, fullName = ''): LocalUser {
  return {
    id: crypto.randomUUID?.() || `local_${Date.now()}`,
    email: email.trim(),
    created_at: new Date().toISOString(),
    user_metadata: { full_name: fullName.trim() || email.split('@')[0] || 'Local user' }
  };
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_SESSION_KEY);
      if (saved) setUser(JSON.parse(saved) as LocalUser);
    } catch {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const startLocalSession = async (email: string, fullName = '') => {
    const nextUser = createLocalUser(email, fullName);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    return { data: nextUser, error: null } as const;
  };

  const value = useMemo<AuthContextType>(() => ({
    user,
    loading,
    signUp: (email, _password, fullName) => startLocalSession(email, fullName),
    signIn: (email, _password) => startLocalSession(email),
    signOut: async () => {
      localStorage.removeItem(LOCAL_SESSION_KEY);
      setUser(null);
    },
    isConfigured: true,
    isPlatformEnabled: true
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
