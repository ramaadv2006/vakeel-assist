import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { api, setCachedToken } from '../api/client';
import { supabase } from '../api/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [advocate, setAdvocate] = useState(null);
  const [loading, setLoading] = useState(true);
  const inFlightRef = useRef(null);
  const lastLoadedRef = useRef(null);
  const RECENT_LOAD_WINDOW_MS = 2000;

  // De-duplicated two ways: login()/signup() and the onAuthStateChange
  // listener below both react to the same sign-in event. Supabase doesn't
  // fire that listener synchronously, so besides guarding concurrent/
  // overlapping calls (inFlightRef), a second call arriving shortly after
  // the first already finished reuses that recent result too, instead of
  // firing another redundant /auth/me round trip.
  const loadProfile = useCallback(() => {
    if (inFlightRef.current) return inFlightRef.current;
    if (lastLoadedRef.current && Date.now() - lastLoadedRef.current.time < RECENT_LOAD_WINDOW_MS) {
      return Promise.resolve(lastLoadedRef.current.advocate);
    }
    const promise = (async () => {
      try {
        const data = await api.get('/auth/me');
        if (data?.advocate) {
          setAdvocate(data.advocate);
          lastLoadedRef.current = { time: Date.now(), advocate: data.advocate };
          return data.advocate;
        }
      } catch (err) {
        console.warn('API /auth/me profile fetch failed, using session fallback:', err);
      } finally {
        inFlightRef.current = null;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const u = session.user;
          const fallback = {
            id: u.id,
            email: u.email,
            name: u.user_metadata?.name || u.email?.split('@')[0] || 'Advocate',
            phone: u.user_metadata?.phone || '',
            bar_council_number: u.user_metadata?.bar_council_number || '',
            avatar_url: u.user_metadata?.avatar_url || '',
          };
          setAdvocate(fallback);
          lastLoadedRef.current = { time: Date.now(), advocate: fallback };
          return fallback;
        }
      } catch (e) {
        console.error('Failed to get session fallback:', e);
      }

      setAdvocate(null);
      return null;
    })();
    inFlightRef.current = promise;
    return promise;
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Seed the token cache from this response directly rather than calling
    // getSession() again right after - see client.js's setCachedToken.
    setCachedToken(data.session?.access_token ?? null);
    const advocate = await loadProfile();
    if (!advocate && data.user) {
      const u = data.user;
      const fallback = {
        id: u.id,
        email: u.email,
        name: u.user_metadata?.name || u.email?.split('@')[0] || 'Advocate',
        phone: u.user_metadata?.phone || '',
        bar_council_number: u.user_metadata?.bar_council_number || '',
        avatar_url: u.user_metadata?.avatar_url || '',
      };
      setAdvocate(fallback);
      return fallback;
    }
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
    setCachedToken(data.session.access_token);
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
