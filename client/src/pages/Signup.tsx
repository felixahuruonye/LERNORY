import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle, signInWithEmail } from "@/lib/supabase";
import { Loader2, Zap, Mail, ArrowLeft, CheckCircle, UserPlus } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Link } from "wouter";

export default function Signup() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Pre-fill email from URL if coming from login page
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchString]);

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Signup Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Signup Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await signInWithEmail(email);
      if (error) {
        toast({
          title: "Signup Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setEmailSent(true);
        toast({
          title: "Check Your Email",
          description: "We sent you a magic link to create your account",
        });
      }
    } catch (err) {
      toast({
        title: "Signup Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    "AI-powered personalized tutoring",
    "Voice-first learning experience",
    "CBT exam preparation for JAMB, WAEC, NECO",
    "Smart course generation",
  ];

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
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
          <div className="hidden md:block space-y-6">
            <h1 className="text-3xl lg:text-4xl font-display font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              Start Your Learning Journey Today
            </h1>
            <p className="text-lg text-muted-foreground">
              Join thousands of students using AI-powered education to achieve their academic goals.
            </p>
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
                <Zap className="h-7 w-7 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-display">Get Started</CardTitle>
              <CardDescription>Create your free account to begin learning</CardDescription>
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
                    onClick={handleGoogleSignup}
                    disabled={isGoogleLoading}
                    data-testid="button-google-signup"
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

                  <form onSubmit={handleEmailSignup} className="space-y-4">
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
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full text-base bg-gradient-to-r from-chart-2 to-primary border-primary"
                      disabled={isLoading}
                      data-testid="button-email-signup"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <UserPlus className="h-5 w-5 mr-2" />
                      )}
                      Create Account
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      We'll send you a magic link to set up your account instantly
                    </p>
                  </form>

                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
                      Log in
                    </Link>
                  </p>

                  <p className="text-center text-xs text-muted-foreground">
                    By signing up, you agree to our Terms of Service and Privacy Policy
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
        </div>
      </main>
    </div>
  );
}
