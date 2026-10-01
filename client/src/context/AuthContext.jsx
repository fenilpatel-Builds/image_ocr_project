import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session
    const initAuth = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (err) {
          console.warn('Session expired or invalid, auto-logging into default demo account');
          api.setToken(null);
          // Auto login to demo user so app is immediately usable without extra clicks!
          try {
            const demoRes = await api.demoLogin('user');
            setUser(demoRes.user);
          } catch (e) {
            console.error('Demo login failed', e);
          }
        }
      } else {
        // Auto-login to demo user on first visit for zero-friction evaluation
        try {
          const demoRes = await api.demoLogin('user');
          setUser(demoRes.user);
        } catch (e) {
          console.error('Auto demo login failed', e);
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    setUser(res.user);
    return res.user;
  };

  const register = async (name, email, password) => {
    const res = await api.register(name, email, password);
    setUser(res.user);
    return res.user;
  };

  const switchRole = async (role) => {
    setLoading(true);
    try {
      const res = await api.demoLogin(role);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
