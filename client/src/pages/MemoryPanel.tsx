import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "wouter";
import {
  ArrowLeft,
  Brain,
  Trash2,
  Edit2,
  Plus,
  Settings,
  Target,
  BookOpen,
  Code2,
  Lightbulb,
  Globe,
} from "lucide-react";

export default function MemoryPanel() {
  const { user, isLoading: authLoading } = useAuth();
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const memoryCategories = [
    {
      id: "preferences",
      title: "Learning Preferences",
      icon: Settings,
      color: "from-blue-500 to-cyan-500",
      items: [
        { key: "learningStyle", value: "Visual + Hands-on" },
        { key: "pace", value: "Moderate" },
        { key: "language", value: "English" },
      ],
    },
    {
      id: "goals",
      title: "Long-Term Goals",
      icon: Target,
      color: "from-purple-500 to-pink-500",
      items: [
        { key: "careerGoal", value: "Software Engineer" },
        { key: "examTarget", value: "JAMB 300+" },
        { key: "timeline", value: "6 months" },
      ],
    },
    {
      id: "skills",
      title: "Technical Skills",
      icon: Code2,
      color: "from-green-500 to-emerald-500",
      items: [
        { key: "languages", value: "Python, JavaScript, React" },
        { key: "level", value: "Intermediate" },
        { key: "focus", value: "Web Development" },
      ],
    },
    {
      id: "interests",
      title: "Subjects of Interest",
      icon: Lightbulb,
      color: "from-orange-500 to-red-500",
      items: [
        { key: "primary", value: "Physics, Mathematics" },
        { key: "secondary", value: "Chemistry, Biology" },
        { key: "hobbies", value: "Coding, Blogging" },
      ],
    },
    {
      id: "business",
      title: "Business & Education Details",
      icon: Globe,
      color: "from-teal-500 to-cyan-500",
      items: [
        { key: "school", value: "Not specified" },
        { key: "course", value: "Engineering" },
        { key: "workExperience", value: "2 years" },
      ],
    },
    {
      id: "writing",
      title: "Writing Style",
      icon: BookOpen,
      color: "from-rose-500 to-pink-500",
      items: [
        { key: "tone", value: "Professional" },
        { key: "formality", value: "Formal" },
        { key: "audience", value: "Technical" },
      ],
    },
  ];

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild className="hover-elevate" data-testid="button-back">
                <Link href="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <Brain className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Memory System</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Memory Toggle */}
        <Card className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-chart-2/10 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Memory System Status</h2>
              <p className="text-sm text-muted-foreground">
                {memoryEnabled
                  ? "Your learning patterns, preferences, and goals are being tracked to personalize your experience."
                  : "Memory system is disabled. Your data won't be tracked."}
              </p>
            </div>
            <Switch
              checked={memoryEnabled}
              onCheckedChange={setMemoryEnabled}
              data-testid="switch-memory-enabled"
            />
          </div>
        </Card>

        {/* Memory Categories */}
        <div className="grid md:grid-cols-2 gap-6">
          {memoryCategories.map((category) => (
            <Card key={category.id} className="hover-elevate transition-all overflow-hidden" data-testid={`card-memory-${category.id}`}>
              <div className={`bg-gradient-to-r ${category.color} p-4`}>
                <div className="flex items-center gap-3">
                  <category.icon className="h-6 w-6 text-white" />
                  <CardTitle className="text-white">{category.title}</CardTitle>
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                {category.items.map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-3 p-3 bg-secondary/50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">{item.key}</p>
                      {editing === `${category.id}-${item.key}` ? (
                        <Textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="text-sm mb-2"
                          rows={2}
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.value}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {editing === `${category.id}-${item.key}` ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditing(null)}
                            className="hover-elevate"
                            data-testid={`button-save-${category.id}-${item.key}`}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditing(null)}
                            className="hover-elevate"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(`${category.id}-${item.key}`);
                            setEditValue(item.value);
                          }}
                          className="hover-elevate"
                          data-testid={`button-edit-${category.id}-${item.key}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full hover-elevate"
                  data-testid={`button-add-${category.id}`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Data Management */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Button variant="outline" className="hover-elevate" data-testid="button-export-memory">
                <Plus className="h-4 w-4 mr-2" />
                Export Memory Data
              </Button>
              <Button variant="outline" className="hover-elevate" data-testid="button-backup-memory">
                <Plus className="h-4 w-4 mr-2" />
                Create Backup
              </Button>
              <Button variant="destructive" className="hover-elevate" data-testid="button-clear-memory">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Memory
              </Button>
              <Button variant="outline" className="hover-elevate" data-testid="button-reset-preferences">
                <Plus className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
