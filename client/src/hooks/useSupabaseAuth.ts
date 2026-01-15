import { useState, useEffect, useCallback } from 'react';
import { supabase, signInWithGoogle, signInWithEmail, signOut as supabaseSignOut, SupabaseUser } from '@/lib/supabase';
import type { User as AuthUser } from '@supabase/supabase-js';
import type { User } from '@shared/schema';

interface UseSupabaseAuthReturn {
  user: User | null;
  authUser: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithOTP: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

export function useSupabaseAuth(): UseSupabaseAuthReturn {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (authUser: AuthUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // Only log serious errors, not table missing during setup
        if (error.message !== "Could not find the table 'public.users' in the schema cache") {
          console.error('Error fetching user profile:', error);
        }
        return null;
      }

      if (!data) {
        const newUser = {
          id: authUser.id,
          email: authUser.email || '',
          first_name: authUser.user_metadata?.full_name?.split(' ')[0] || authUser.user_metadata?.name?.split(' ')[0] || '',
          last_name: authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          profile_image_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
          role: 'student',
          subscription_tier: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          return null;
        }

        return mapSupabaseUserToUser(insertedUser);
      }

      return mapSupabaseUserToUser(data);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setAuthUser(session.user);
          const userProfile = await fetchUserProfile(session.user);
          setUser(userProfile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setAuthUser(session.user);
        const userProfile = await fetchUserProfile(session.user);
        setUser(userProfile);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setAuthUser(null);
        setUser(null);
        setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setAuthUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const handleSignInWithGoogle = useCallback(async () => {
    const { error } = await signInWithGoogle();
    return { error: error ? new Error(error.message) : null };
  }, []);

  const handleSignInWithOTP = useCallback(async (email: string) => {
    const { error } = await signInWithEmail(email);
    return { error: error ? new Error(error.message) : null };
  }, []);

  const handleSignOut = useCallback(async () => {
    const { error } = await supabaseSignOut();
    if (!error) {
      setAuthUser(null);
      setUser(null);
    }
    return { error: error ? new Error(error.message) : null };
  }, []);

  return {
    user,
    authUser,
    isLoading,
    isAuthenticated: !!user,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithOTP: handleSignInWithOTP,
    signOut: handleSignOut,
  };
}

function mapSupabaseUserToUser(data: any): User {
  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    profileImageUrl: data.profile_image_url,
    role: data.role || 'student',
    schoolId: data.school_id,
    subscriptionTier: data.subscription_tier || 'free',
    subscriptionExpiresAt: data.subscription_expires_at ? new Date(data.subscription_expires_at) : null,
    paystackCustomerId: data.paystack_customer_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}
