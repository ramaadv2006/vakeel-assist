import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [advocate, setAdvocate] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!getToken()) {
      setAdvocate(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.get('/auth/me');
      setAdvocate(data.advocate);
    } catch {
      setToken(null);
      setAdvocate(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setAdvocate(data.advocate);
    return data.advocate;
  };

  const signup = async (payload) => {
    const data = await api.post('/auth/signup', payload);
    setToken(data.token);
    setAdvocate(data.advocate);
    return data.advocate;
  };

  const logout = () => {
    setToken(null);
    setAdvocate(null);
  };

  const refresh = async () => {
    const data = await api.get('/auth/me');
    setAdvocate(data.advocate);
    return data.advocate;
  };

  return (
    <AuthContext.Provider value={{ advocate, loading, login, signup, logout, refresh, setAdvocate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
