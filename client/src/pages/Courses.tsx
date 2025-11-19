import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  Search,
  Plus,
  BookOpen,
  Clock,
  Users,
  Star,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Courses() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

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
              <h1 className="font-display font-semibold text-lg">Courses</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          {isTeacher && (
            <Button className="hover-elevate active-elevate-2" data-testid="button-create-course">
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          )}
        </div>

        {/* Empty State */}
        <div className="text-center py-16">
          <ScrollReveal>
            <div className="max-w-md mx-auto">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-semibold mb-3">
                {isTeacher ? "Create Your First Course" : "No Courses Yet"}
              </h2>
              <p className="text-muted-foreground mb-6">
                {isTeacher
                  ? "Use AI to generate comprehensive course syllabi from simple topics"
                  : "Enroll in courses to start your learning journey"}
              </p>
              {isTeacher && (
                <Button
                  size="lg"
                  className="hover-elevate active-elevate-2"
                  data-testid="button-get-started"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate with AI
                </Button>
              )}
            </div>
          </ScrollReveal>
        </div>

        {/* Sample Course Cards (for demonstration) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[
            {
              title: "Introduction to Physics",
              description: "Fundamental concepts and principles of physics",
              students: 45,
              duration: "8 weeks",
              rating: 4.8,
            },
            {
              title: "Advanced Mathematics",
              description: "Calculus, algebra, and trigonometry",
              students: 32,
              duration: "10 weeks",
              rating: 4.9,
            },
            {
              title: "Chemistry Basics",
              description: "Atoms, molecules, and chemical reactions",
              students: 38,
              duration: "6 weeks",
              rating: 4.7,
            },
          ].map((course, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <Card className="hover-elevate active-elevate-2 cursor-pointer h-full" data-testid={`card-course-${index}`}>
                <CardHeader>
                  <div className="h-32 bg-gradient-to-br from-primary/20 to-chart-2/20 rounded-lg mb-4 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {course.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{course.students}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{course.rating}</span>
                    </div>
                  </div>
                  <Button className="w-full hover-elevate active-elevate-2">
                    View Course
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
