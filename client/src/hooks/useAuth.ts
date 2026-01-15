import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, signInWithGoogle as supabaseGoogleSignIn, signInWithEmail as supabaseEmailSignIn, signOut as supabaseSignOut } from '@/lib/supabase';
import type { User } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [supabaseLoading, setSupabaseLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState<'replit' | 'supabase' | null>(null);

  const { data: replitUser, isLoading: replitLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const initSupabaseAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userProfile) {
            setSupabaseUser(mapDbUserToUser(userProfile));
            setAuthMethod('supabase');
          } else {
            const newUser = {
              id: session.user.id,
              email: session.user.email || '',
              first_name: session.user.user_metadata?.full_name?.split(' ')[0] || '',
              last_name: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
              profile_image_url: session.user.user_metadata?.avatar_url || '',
              role: 'student',
              subscription_tier: 'free',
            };

            const { data: created } = await supabase.from('users').insert(newUser).select().single();
            if (created) {
              setSupabaseUser(mapDbUserToUser(created));
              setAuthMethod('supabase');
            }
          }
        }
      } catch (error) {
        console.error('Supabase auth init error:', error);
      } finally {
        setSupabaseLoading(false);
      }
    };

    initSupabaseAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userProfile) {
          setSupabaseUser(mapDbUserToUser(userProfile));
          setAuthMethod('supabase');
        }
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      } else if (event === 'SIGNED_OUT') {
        setSupabaseUser(null);
        setAuthMethod(null);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  useEffect(() => {
    if (replitUser && !supabaseUser) {
      setAuthMethod('replit');
    }
  }, [replitUser, supabaseUser]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabaseGoogleSignIn();
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signInWithOTP = useCallback(async (email: string) => {
    const { error } = await supabaseEmailSignIn(email);
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    if (authMethod === 'supabase') {
      const { error } = await supabaseSignOut();
      if (!error) {
        setSupabaseUser(null);
        setAuthMethod(null);
      }
      return { error: error ? new Error(error.message) : null };
    } else {
      window.location.href = '/api/logout';
      return { error: null };
    }
  }, [authMethod]);

  const user = supabaseUser || replitUser || null;
  const isLoading = supabaseLoading && replitLoading;
  const isAuthenticated = !!user;

  return {
    user,
    isLoading,
    isAuthenticated,
    authMethod,
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
