import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface AuthHandlerProps {
  children: React.ReactNode;
}

export function AuthHandler({ children }: AuthHandlerProps) {
  const [, setLocation] = useLocation();
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  useEffect(() => {
    const handleHashAuth = async () => {
      const hash = window.location.hash;
      
      if (hash && hash.includes('access_token')) {
        setIsProcessingAuth(true);
        
        try {
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('Auth error:', error);
              window.history.replaceState(null, '', window.location.pathname);
              setLocation('/login');
            } else {
              window.history.replaceState(null, '', '/dashboard');
              setLocation('/dashboard');
            }
          }
        } catch (err) {
          console.error('Auth processing error:', err);
          window.history.replaceState(null, '', window.location.pathname);
        } finally {
          setIsProcessingAuth(false);
        }
      }
    };

    handleHashAuth();
  }, [setLocation]);

  if (isProcessingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Signing you in...</p>
          <p className="text-sm text-muted-foreground mt-2">Please wait while we verify your credentials</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
