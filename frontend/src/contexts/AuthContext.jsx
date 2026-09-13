import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  api,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  getStoredUser,
  setStoredUser,
  removeStoredUser,
} from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    setLoading(false);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    setStoredToken(data.access_token);
    setStoredUser(data.user);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    removeStoredToken();
    removeStoredUser();
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isTeamMember = user?.role === 'team_member';

  const value = {
    user,
    token,
    loading,
    isAdmin,
    isTeamMember,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
