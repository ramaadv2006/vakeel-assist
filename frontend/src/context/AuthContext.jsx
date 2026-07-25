import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { supabase } from '../api/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [advocate, setAdvocate] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const data = await api.get('/auth/me');
      setAdvocate(data.advocate);
      return data.advocate;
    } catch {
      setAdvocate(null);
      return null;
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) await loadProfile();
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await loadProfile();
      } else {
        setAdvocate(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const advocate = await loadProfile();
    if (!advocate) throw new Error('Logged in, but failed to load your profile. Please try again.');
    return advocate;
  };

  // Returns { confirmationRequired: true } when Supabase has "Confirm email"
  // turned on and doesn't issue a session until the user clicks the emailed
  // link; otherwise { confirmationRequired: false, advocate }.
  const signup = async ({ name, email, phone, bar_council_number, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone, bar_council_number } },
    });
    if (error) throw error;
    if (!data.session) {
      return { confirmationRequired: true };
    }
    const advocate = await loadProfile();
    if (!advocate) throw new Error('Account created, but failed to load your profile. Please try logging in.');
    return { confirmationRequired: false, advocate };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAdvocate(null);
  };

  return (
    <AuthContext.Provider value={{ advocate, loading, login, signup, logout, refresh: loadProfile, setAdvocate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
