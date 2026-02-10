import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  username: string;
  subscriptionStatus: 'active' | 'expired' | 'cancelled';
  subscriptionExpiresAt: string | null;
  allowedIp: string | null;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isIpBlocked: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithUsername: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isIpBlocked, setIsIpBlocked] = useState(false);

  // Global cache for the public IP
  const [cachedIp, setCachedIp] = useState<string | null>(null);

  const getPublicIP = async () => {
    if (cachedIp) return cachedIp;

    try {
      // Create a promise that rejects after 2.5 seconds
      const timeout = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('IP fetch timeout')), 2500)
      );

      const fetchIp = (async () => {
        const response = await fetch('https://api64.ipify.org?format=json');
        const data = await response.json();
        return data.ip as string;
      })();

      const ip = await Promise.race([fetchIp, timeout]);
      if (ip) setCachedIp(ip);
      return ip;
    } catch (error) {
      console.error('Error fetching IP:', error);
      return null;
    }
  };

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // Parallelize IP fetch and user profile fetch
      const [currentIp, { data, error }] = await Promise.all([
        getPublicIP(),
        supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle()
      ]);

      if (error) throw error;

      if (data) {
        // IP Protection Logic
        if (!data.allowed_ip && currentIp) {
          // First login, lock to this IP
          await supabase
            .from('users')
            .update({ allowed_ip: currentIp })
            .eq('id', userId);
          data.allowed_ip = currentIp;
        }

        const isActuallyAdmin = data.email === 'admin@sensipro.com' || data.email === 'admin@game-hub.local';
        const isBlocked = !!data.allowed_ip && !!currentIp && data.allowed_ip !== currentIp;

        setIsIpBlocked(!isActuallyAdmin && isBlocked);

        setUser({
          id: data.id,
          email: data.email,
          username: data.username,
          subscriptionStatus: data.subscription_status,
          subscriptionExpiresAt: data.subscription_expires_at,
          allowedIp: data.allowed_ip,
          isAdmin: isActuallyAdmin,
        });
      } else {
        // Fallback for missing profile
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email;
        const isActuallyAdmin = email === 'admin@sensipro.com' || email === 'admin@game-hub.local';

        if (isActuallyAdmin) {
          setUser({
            id: userId,
            email: email || '',
            username: 'Admin',
            subscriptionStatus: 'active',
            subscriptionExpiresAt: null,
            allowedIp: null,
            isAdmin: true,
          });
        } else {
          console.warn('User profile not found in public.users table.');
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    try {
      // Create auth user with username in metadata
      // This allows the database trigger to automatically create the profile
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (authError) throw authError;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const loginWithUsername = useCallback(async (username: string, password: string, rememberMe: boolean = true) => {
    try {
      // If it looks like an email, use it directly. Otherwise, add suffix.
      // If it looks like an email, use it directly.
      // If it's "admin", use admin@sensipro.com.
      // Otherwise, add suffix.
      let email = username;
      if (!username.includes('@')) {
        email = username === 'admin' ? 'admin@sensipro.com' : `${username}@game-hub.local`;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      // Clear local state regardless of server-side success
      setUser(null);
      setSession(null);
      setIsIpBlocked(false);
      // Force clear any remaining supabase keys in localStorage as a fallback
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase.auth.token') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session && !!user && user.subscriptionStatus === 'active' && !isIpBlocked,
        isIpBlocked,
        isAdmin: user?.isAdmin || false,
        loading,
        login,
        loginWithUsername,
        logout,
        signUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
