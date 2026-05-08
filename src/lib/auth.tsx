'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { Profile } from './types';
import { createClient } from './supabase/client';
import { useRouter } from 'next/navigation';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: 'trainee' | 'trainer') => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  // Helper to fetch profile details and map role_id to string role
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, roles!role_id(role_name)')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        // Mapped role from the join
        const rawRole = (data.roles?.role_name || '').toLowerCase();
        let roleName: 'admin' | 'trainer' | 'trainee' = 'trainee';
        if (rawRole.includes('admin')) roleName = 'admin';
        else if (rawRole.includes('trainer')) roleName = 'trainer';

        setUser({
          ...data,
          role: roleName,
        });
      } else {
        setUser(null);
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err.message);
      setUser(null);
    }
  }, [supabase]);

  // Initial session check and auth state listener
  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return false;
    }

    // onAuthStateChange handles the profile fetching
    return true;
  }, [supabase]);

  const register = useCallback(async (
    name: string, 
    email: string, 
    password: string, 
    role: 'trainee' | 'trainer'
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const roleId = role === 'trainer' ? 2 : 3;

    try {
      console.log('Starting registration for:', email);
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role_id: roleId,
          }
        }
      });

      if (signUpError) {
        console.error('Registration signUp error:', signUpError.message);
        setError(signUpError.message);
        return false;
      }

      console.log('Sign up successful, user ID:', signUpData.user?.id);

      // Immediately sign out so they have to log in manually
      console.log('Signing out after registration...');
      await supabase.auth.signOut();
      
      console.log('Registration flow complete.');
      return true;
    } catch (err: any) {
      console.error('Unexpected registration error:', err);
      setError(err.message || 'An unexpected error occurred.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setUser(null);
      setIsLoading(false);
      router.push('/');
    }
  }, [supabase, router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
