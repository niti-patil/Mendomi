import React, { createContext, useState, useContext, useEffect } from 'react';
import { DEMO_USER } from '@/lib/demoData';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    setUser({ ...DEMO_USER });
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
    setAuthChecked(true);
    setIsLoadingPublicSettings(false);
    setAuthError(null);
  }, []);

  const checkAppState = async () => {
    setUser({ ...DEMO_USER });
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
    setAuthChecked(true);
    setIsLoadingPublicSettings(false);
    setAuthError(null);
  };

  const checkUserAuth = async () => {
    setUser({ ...DEMO_USER });
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
    setAuthChecked(true);
  };

  const logout = () => {
    setUser({ ...DEMO_USER });
    setIsAuthenticated(true);
  };

  const navigateToLogin = () => {};

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
