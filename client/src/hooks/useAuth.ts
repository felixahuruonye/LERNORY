import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { supabase, signInWithGoogle as supabaseGoogleSignIn, signInWithEmail as supabaseEmailSignIn, signOut as supabaseSignOut } from '@/lib/supabase';
import type { User } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (authUser: any) => {
    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        return null;
      }

      if (!userProfile) {
        const newUser = {
          id: authUser.id,
          email: authUser.email || '',
          first_name: authUser.user_metadata?.full_name?.split(' ')[0] || authUser.user_metadata?.name?.split(' ')[0] || '',
          last_name: authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || authUser.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
          profile_image_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
          role: 'student',
          subscription_tier: 'free',
        };

        const { data: created, error: insertError } = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          return null;
        }

        return mapDbUserToUser(created);
      }

      return mapDbUserToUser(userProfile);
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
          const userProfile = await fetchUserProfile(session.user);
          setUser(userProfile);
        }
      } catch (error) {
        console.error('Supabase auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userProfile = await fetchUserProfile(session.user);
        setUser(userProfile);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
        queryClient.clear();
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        const userProfile = await fetchUserProfile(session.user);
        setUser(userProfile);
      }
    });

    return () => {
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
