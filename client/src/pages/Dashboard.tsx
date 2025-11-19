import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Mic,
  Brain,
  Upload,
  BookOpen,
  TrendingUp,
  Clock,
  Target,
  Award,
  Plus,
  GraduationCap,
  DollarSign,
  Users,
} from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, authLoading, toast]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const isTeacher = user.role === "teacher" || user.role === "lecturer" || user.role === "school";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-lg bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/">
                <a className="text-xl font-display font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                  LERNORY
                </a>
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Button variant="ghost" asChild className="hover-elevate active-elevate-2">
                  <Link href="/live-session">
                    <a data-testid="link-live-session">Live Sessions</a>
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="hover-elevate active-elevate-2">
                  <Link href="/chat">
                    <a data-testid="link-chat">AI Tutor</a>
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="hover-elevate active-elevate-2">
                  <Link href="/courses">
                    <a data-testid="link-courses">Courses</a>
                  </Link>
                </Button>
                {isTeacher && (
                  <Button variant="ghost" asChild className="hover-elevate active-elevate-2">
                    <Link href="/marketplace">
                      <a data-testid="link-marketplace">Marketplace</a>
                    </Link>
                  </Button>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                variant="ghost"
                className="hover-elevate active-elevate-2"
                asChild
                data-testid="button-logout"
              >
                <a href="/api/logout">Logout</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <ScrollReveal>
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">
              Welcome back, {user.firstName || user.email}!
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {time.toLocaleDateString()} • {time.toLocaleTimeString()}
            </p>
          </div>
        </ScrollReveal>

        {isTeacher ? (
          // Teacher Dashboard
          <>
            {/* Quick Actions */}
            <ScrollReveal delay={100}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-start-session">
                  <Link href="/live-session/new">
                    <a className="block p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Mic className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Start Live Session</h3>
                          <p className="text-sm text-muted-foreground">Record a lecture</p>
                        </div>
                      </div>
                    </a>
                  </Link>
                </Card>

                <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-create-course">
                  <Link href="/courses/new">
                    <a className="block p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-chart-2/10 flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-chart-2" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Create Course</h3>
                          <p className="text-sm text-muted-foreground">Build new content</p>
                        </div>
                      </div>
                    </a>
                  </Link>
                </Card>

                <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-create-exam">
                  <Link href="/exams/new">
                    <a className="block p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
                          <GraduationCap className="h-6 w-6 text-chart-3" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Create Exam</h3>
                          <p className="text-sm text-muted-foreground">Design a test</p>
                        </div>
                      </div>
                    </a>
                  </Link>
                </Card>
              </div>
            </ScrollReveal>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <ScrollReveal delay={200}>
                <Card data-testid="card-stat-students">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">Across all courses</p>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={250}>
                <Card data-testid="card-stat-courses">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">Published courses</p>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={300}>
                <Card data-testid="card-stat-sessions">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Live Sessions</CardTitle>
                    <Mic className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={350}>
                <Card data-testid="card-stat-earnings">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Earnings</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₦0</div>
                    <p className="text-xs text-muted-foreground">From marketplace</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>

            {/* Recent Activity */}
            <ScrollReveal delay={400}>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity yet</p>
                    <p className="text-sm mt-2">Start by creating your first course or live session</p>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </>
        ) : (
          // Student Dashboard
          <>
            {/* Quick Start */}
            <ScrollReveal delay={100}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-join-session">
                  <Link href="/live-session">
                    <a className="block p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Mic className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Join Live Session</h3>
                          <p className="text-sm text-muted-foreground">Attend a lecture</p>
                        </div>
                      </div>
                    </a>
                  </Link>
                </Card>

                <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-ask-tutor">
                  <Link href="/chat">
                    <a className="block p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-chart-2/10 flex items-center justify-center">
                          <Brain className="h-6 w-6 text-chart-2" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Ask AI Tutor</h3>
                          <p className="text-sm text-muted-foreground">Get instant help</p>
                        </div>
                      </div>
                    </a>
                  </Link>
                </Card>

                <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-upload-notes">
                  <Link href="/upload">
                    <a className="block p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
                          <Upload className="h-6 w-6 text-chart-3" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Upload Notes</h3>
                          <p className="text-sm text-muted-foreground">Process files</p>
                        </div>
                      </div>
                    </a>
                  </Link>
                </Card>
              </div>
            </ScrollReveal>

            {/* Progress & Weak Topics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ScrollReveal delay={200}>
                <Card data-testid="card-progress">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Learning Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Overall Completion</span>
                          <span className="text-sm text-muted-foreground">0%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: "0%" }} />
                        </div>
                      </div>
                      <div className="text-center py-8 text-muted-foreground">
                        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Start learning to track your progress</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={300}>
                <Card data-testid="card-weak-topics">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-chart-4" />
                      Focus Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No weak topics identified yet</p>
                      <p className="text-sm mt-2">Complete quizzes to get personalized recommendations</p>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>

            {/* Today's Lessons */}
            <ScrollReveal delay={400}>
              <Card>
                <CardHeader>
                  <CardTitle>Today's Lessons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No lessons scheduled</p>
                    <p className="text-sm mt-2">Explore courses to get started</p>
                    <Button className="mt-4 hover-elevate active-elevate-2" asChild>
                      <Link href="/courses">
                        <a>Browse Courses</a>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-chart-2 shadow-lg hover:scale-110 active:scale-95 transition-transform flex items-center justify-center group z-40"
        data-testid="button-fab"
        onClick={() => {
          if (isTeacher) {
            window.location.href = "/live-session/new";
          } else {
            window.location.href = "/chat";
          }
        }}
      >
        <Plus className="h-6 w-6 text-primary-foreground" />
        <span className="sr-only">Quick action</span>
      </button>
    </div>
  );
}
