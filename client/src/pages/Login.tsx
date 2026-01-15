import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle, signInWithEmail } from "@/lib/supabase";
import { Loader2, Zap, Mail, ArrowLeft, LogIn } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Link } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await signInWithEmail(email);
      if (error) {
        // Check if error indicates user doesn't exist - redirect to signup
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('not found') || errorMsg.includes('invalid') || errorMsg.includes('no user')) {
          toast({
            title: "Account Not Found",
            description: "Let's create an account for you!",
          });
          setLocation(`/signup?email=${encodeURIComponent(email)}`);
        } else {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        setEmailSent(true);
        toast({
          title: "Magic Link Sent!",
          description: "Check your email and click the link to sign in instantly",
        });
      }
    } catch (err) {
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-lg bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-display font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                  LERNORY
                </span>
              </div>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pt-20 pb-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
              <Zap className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-display">Welcome Back</CardTitle>
            <CardDescription>Sign in to continue your learning journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {emailSent ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Check Your Email</h3>
                <p className="text-muted-foreground mb-4">
                  We sent a magic link to <strong>{email}</strong>
                </p>
                <Button
                  variant="ghost"
                  onClick={() => setEmailSent(false)}
                  data-testid="button-try-different-email"
                >
                  Try a different email
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="w-full h-12 text-base"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  data-testid="button-google-login"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <SiGoogle className="h-5 w-5 mr-2" />
                  )}
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      data-testid="input-email"
                    />
                  </div>

                  {/* Primary Login button with gradient */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full text-base bg-gradient-to-r from-primary to-chart-2 border-primary"
                    disabled={isLoading}
                    data-testid="button-email-login"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <LogIn className="h-5 w-5 mr-2" />
                    )}
                    Login with Email
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    We'll send you a secure magic link to sign in instantly
                  </p>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-primary hover:underline" data-testid="link-signup">
                    Sign up
                  </Link>
                </p>
              </>
            )}

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setLocation("/")}
              data-testid="button-back-home"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
