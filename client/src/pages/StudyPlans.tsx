import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  BookOpen, Plus, Calendar, Zap, ArrowRight, ArrowLeft, 
  Target, CheckCircle, Clock, Sparkles, Loader2
} from "lucide-react";

interface StudyPlan {
  id: string;
  title: string;
  subjects: string[];
  examType: string;
  deadline: string;
  hoursPerDay: number;
  weakAreas: string[];
  schedule: {
    title: string;
    summary: string;
    days: Array<{
      day: number;
      date: string;
      subjects: string[];
      topics: string[];
      duration: number;
      activities: string[];
      focus: string;
    }>;
    tips: string[];
    weeklyGoals: string[];
  };
  progress: { completedDays: number; totalDays: number };
  createdAt: string;
}

const SUBJECTS = [
  "Mathematics", "English", "Physics", "Chemistry", "Biology",
  "Government", "Economics", "Literature", "Geography", "History",
  "Computer Science", "Accounting", "Commerce", "Agriculture"
];

const EXAM_TYPES = [
  { value: "JAMB", label: "JAMB UTME" },
  { value: "WAEC", label: "WAEC SSCE" },
  { value: "NECO", label: "NECO" },
  { value: "POST_UTME", label: "Post-UTME" },
  { value: "GENERAL", label: "General Studies" },
];

export default function StudyPlans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  
  const [formData, setFormData] = useState({
    subjects: [] as string[],
    examType: "",
    deadline: "",
    hoursPerDay: 3,
    weakAreas: "",
    goal: "",
  });

  const { data: plans = [], isLoading } = useQuery<StudyPlan[]>({
    queryKey: ["/api/study-plans"],
    enabled: !!user,
  });

  const generateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/study-plans/generate", {
        ...data,
        weakAreas: data.weakAreas.split(",").map(s => s.trim()).filter(Boolean),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-plans"] });
      setShowCreateDialog(false);
      setFormData({ subjects: [], examType: "", deadline: "", hoursPerDay: 3, weakAreas: "", goal: "" });
      toast({ title: "Success", description: "Study plan created successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleGenerate = () => {
    if (formData.subjects.length === 0) {
      toast({ title: "Error", description: "Please select at least one subject", variant: "destructive" });
      return;
    }
    generateMutation.mutate(formData);
  };

  if (selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-primary/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSelectedPlan(null)} data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{selectedPlan.title}</h1>
                <p className="text-muted-foreground text-sm">
                  {selectedPlan.schedule?.summary || `${selectedPlan.subjects.length} subjects`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Study Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedPlan.schedule?.days?.map((day) => (
                    <div key={day.day} className="p-4 rounded-lg border bg-muted/30" data-testid={`day-${day.day}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{day.date}</Badge>
                          <span className="font-semibold">{day.subjects.join(", ")}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {day.duration} hrs
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        <strong>Topics:</strong> {day.topics.join(", ")}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {day.activities.map((activity, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{activity}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-chart-2" />
                    Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Completed Days</span>
                        <span>{selectedPlan.progress?.completedDays || 0} / {selectedPlan.progress?.totalDays || selectedPlan.schedule?.days?.length || 0}</span>
                      </div>
                      <Progress value={((selectedPlan.progress?.completedDays || 0) / (selectedPlan.progress?.totalDays || 1)) * 100} />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Deadline: {selectedPlan.deadline ? new Date(selectedPlan.deadline).toLocaleDateString() : "Not set"}
                      </p>
                      <p className="flex items-center gap-1 mt-1">
                        <Clock className="h-4 w-4" />
                        {selectedPlan.hoursPerDay} hours/day
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedPlan.schedule?.tips?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-chart-4" />
                      Study Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {selectedPlan.schedule.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-chart-2 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-primary/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" data-testid="button-back-dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Study Plans</h1>
                <p className="text-muted-foreground">Create and track personalized study schedules</p>
              </div>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-create-plan">
                  <Plus className="h-4 w-4" />
                  Create Study Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Generate AI Study Plan
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Select Subjects</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SUBJECTS.map(subject => (
                        <div key={subject} className="flex items-center space-x-2">
                          <Checkbox 
                            id={subject} 
                            checked={formData.subjects.includes(subject)}
                            onCheckedChange={() => toggleSubject(subject)}
                            data-testid={`checkbox-${subject.toLowerCase().replace(" ", "-")}`}
                          />
                          <label htmlFor={subject} className="text-sm cursor-pointer">{subject}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="examType">Exam Type</Label>
                      <Select value={formData.examType} onValueChange={(v) => setFormData(prev => ({ ...prev, examType: v }))}>
                        <SelectTrigger data-testid="select-exam-type">
                          <SelectValue placeholder="Select exam" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXAM_TYPES.map(exam => (
                            <SelectItem key={exam.value} value={exam.value}>{exam.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="deadline">Target Date</Label>
                      <Input 
                        type="date" 
                        value={formData.deadline}
                        onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                        data-testid="input-deadline"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="hoursPerDay">Study Hours Per Day: {formData.hoursPerDay}</Label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.hoursPerDay}
                      onChange={(e) => setFormData(prev => ({ ...prev, hoursPerDay: parseInt(e.target.value) }))}
                      className="w-full mt-2"
                      data-testid="input-hours"
                    />
                  </div>

                  <div>
                    <Label htmlFor="weakAreas">Weak Areas (comma separated)</Label>
                    <Input 
                      placeholder="e.g., Calculus, Organic Chemistry, Essay Writing"
                      value={formData.weakAreas}
                      onChange={(e) => setFormData(prev => ({ ...prev, weakAreas: e.target.value }))}
                      data-testid="input-weak-areas"
                    />
                  </div>

                  <div>
                    <Label htmlFor="goal">Your Goal (optional)</Label>
                    <Textarea 
                      placeholder="e.g., Score 250+ in JAMB, Focus on passing Chemistry"
                      value={formData.goal}
                      onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                      data-testid="input-goal"
                    />
                  </div>

                  <Button 
                    onClick={handleGenerate} 
                    disabled={generateMutation.isPending || formData.subjects.length === 0}
                    className="w-full gap-2"
                    data-testid="button-generate"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Study Plan
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-2">Loading your study plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="pt-12 pb-12 text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Study Plans Yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your first AI-powered study plan based on your subjects and goals!
              </p>
              <Button size="lg" className="gap-2" onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-plan">
                <Zap className="h-5 w-5" />
                Create Your First Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className="hover-elevate transition-all border-primary/20 cursor-pointer" 
                onClick={() => setSelectedPlan(plan)}
                data-testid={`card-plan-${plan.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-2xl">{plan.title}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {plan.subjects.length} subjects
                        </span>
                        {plan.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(plan.deadline).toLocaleDateString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {plan.hoursPerDay} hrs/day
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {plan.progress?.completedDays || 0} / {plan.progress?.totalDays || plan.schedule?.days?.length || 0} days
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {plan.subjects.map((subj) => (
                      <Badge key={subj} variant="outline" className="bg-primary/5">
                        {subj}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="h-4 w-4" />
                    Click to view full schedule
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
