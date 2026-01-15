import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { supabase, signInWithGoogle as supabaseGoogleSignIn, signInWithEmail as supabaseEmailSignIn, signOut as supabaseSignOut } from '@/lib/supabase';
import type { User } from "@shared/schema";

// Create a basic user from Supabase auth data
function createUserFromAuth(authUser: any): User {
  const now = new Date();
  return {
    id: authUser.id,
    email: authUser.email || '',
    firstName: authUser.user_metadata?.full_name?.split(' ')[0] || authUser.user_metadata?.name?.split(' ')[0] || '',
    lastName: authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || authUser.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
    profileImageUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
    role: 'student',
    schoolId: null,
    subscriptionTier: 'free',
    subscriptionExpiresAt: null,
    paystackCustomerId: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (authUser: any): Promise<User> => {
    // Always create a basic user from auth data first
    const basicUser = createUserFromAuth(authUser);
    
    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // If user exists in DB, return their full profile
      if (!error && userProfile) {
        return mapDbUserToUser(userProfile);
      }

      // User not found - try to create profile in background (non-blocking insert)
      if (error?.code === 'PGRST116') {
        // Fire and forget - don't wait for insert result
        (async () => {
          try {
            await supabase.from('users').insert({
              id: authUser.id,
              email: authUser.email || '',
              first_name: basicUser.firstName,
              last_name: basicUser.lastName,
              profile_image_url: basicUser.profileImageUrl,
              role: 'student',
              subscription_tier: 'free',
            });
          } catch {}
        })();
      }

      return basicUser;
    } catch {
      return basicUser;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        // Add timeout to prevent hanging forever
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (!isMounted) return;
        
        if (result?.data?.session?.user) {
          const userProfile = await fetchUserProfile(result.data.session.user);
          if (isMounted) setUser(userProfile);
        }
      } catch (error) {
        console.warn('Auth initialization error:', error);
        // Silent fail - just mark as not loading
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Set basic user immediately for instant redirect
        const basicUser = createUserFromAuth(session.user);
        setUser(basicUser);
        setIsLoading(false);
        
        // Fetch full profile in background (non-blocking)
        fetchUserProfile(session.user).then(fullProfile => {
          if (isMounted) setUser(fullProfile);
        }).catch(() => {});
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
        queryClient.clear();
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Background profile refresh
        fetchUserProfile(session.user).then(fullProfile => {
          if (isMounted) setUser(fullProfile);
        }).catch(() => {});
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, queryClient]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabaseGoogleSignIn();
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signInWithOTP = useCallback(async (email: string) => {
    const { error } = await supabaseEmailSignIn(email);
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabaseSignOut();
    if (!error) {
      setUser(null);
      queryClient.clear();
    }
    return { error: error ? new Error(error.message) : null };
  }, [queryClient]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signInWithOTP,
    signOut,
  };
}

function mapDbUserToUser(data: any): User {
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
