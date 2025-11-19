import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  Plus,
  GraduationCap,
  Clock,
  FileText,
  ArrowLeft,
  Target,
} from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Exams() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

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
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild className="hover-elevate active-elevate-2">
                <Link href="/dashboard">
                  <a data-testid="link-back">
                    <ArrowLeft className="h-5 w-5" />
                  </a>
                </Link>
              </Button>
              <h1 className="font-display font-semibold text-lg">Exams & Quizzes</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Empty State */}
        <div className="text-center py-16">
          <ScrollReveal>
            <div className="max-w-md mx-auto">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-semibold mb-3">
                {isTeacher ? "Create Your First Exam" : "No Exams Available"}
              </h2>
              <p className="text-muted-foreground mb-6">
                {isTeacher
                  ? "Design CBT exams with auto-grading and detailed analytics"
                  : "Complete exams to test your knowledge and track your progress"}
              </p>
              {isTeacher && (
                <Button
                  size="lg"
                  className="hover-elevate active-elevate-2"
                  data-testid="button-create-exam"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Exam
                </Button>
              )}
            </div>
          </ScrollReveal>
        </div>

        {/* Sample Exams */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[
            {
              title: "Physics Mid-Term",
              questions: 30,
              duration: 60,
              difficulty: "Medium",
            },
            {
              title: "Math Quiz 1",
              questions: 15,
              duration: 30,
              difficulty: "Easy",
            },
            {
              title: "Chemistry Final",
              questions: 50,
              duration: 120,
              difficulty: "Hard",
            },
          ].map((exam, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid={`card-exam-${index}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {exam.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Questions</span>
                      <span className="font-semibold">{exam.questions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="font-semibold">{exam.duration} min</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Difficulty</span>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        <span className="font-semibold">{exam.difficulty}</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full hover-elevate active-elevate-2">
                    {isTeacher ? "View Details" : "Start Exam"}
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </main>
    </div>
  );
}
