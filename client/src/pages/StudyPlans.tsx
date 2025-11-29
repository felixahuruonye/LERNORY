import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BookOpen, Plus, Calendar, Zap, ArrowRight } from "lucide-react";

export default function StudyPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);

  const { isLoading } = useQuery({
    queryKey: ["/api/study-plans"],
    queryFn: async () => {
      const res = await fetch("/api/study-plans", { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      setPlans(data);
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-primary/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Study Plans</h1>
                <p className="text-muted-foreground">Create and track your personalized study schedules</p>
              </div>
            </div>
            <Link href="/advanced-chat">
              <Button className="gap-2" data-testid="button-create-plan">
                <Plus className="h-4 w-4" />
                Ask LEARNORY to Create Plan
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your study plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="pt-12 pb-12 text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Study Plans Yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your first personalized study plan. Ask LEARNORY to generate a custom plan based on your goals!
              </p>
              <Link href="/advanced-chat">
                <Button size="lg" className="gap-2" data-testid="button-create-first-plan">
                  <Zap className="h-5 w-5" />
                  Create Your First Plan
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="hover-elevate transition-all border-primary/20" data-testid={`card-plan-${plan.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{plan.title}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {plan.subjects && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {plan.subjects.length} subjects
                          </span>
                        )}
                        {plan.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(plan.deadline).toLocaleDateString()}
                          </span>
                        )}
                        {plan.hoursPerDay && (
                          <span className="flex items-center gap-1">
                            <Zap className="h-4 w-4" />
                            {plan.hoursPerDay} hrs/day
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {plan.subjects && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold mb-2">Subjects:</p>
                      <div className="flex flex-wrap gap-2">
                        {plan.subjects.map((subj: string) => (
                          <span key={subj} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                            {subj}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <Link href="/advanced-chat">
                    <Button variant="outline" className="w-full gap-2" data-testid={`button-review-plan-${plan.id}`}>
                      Ask About This Plan
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
