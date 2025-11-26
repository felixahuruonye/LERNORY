import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, Trash2, BookOpen } from "lucide-react";

interface GeneratedLesson {
  id: string;
  title: string;
  objectives: string[];
  keyPoints: string[];
  summary: string;
  createdAt: string;
}

export default function GeneratedLessons() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch all generated lessons
  const { data: lessons = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/generated-lessons"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/generated-lessons");
      return res.json();
    },
  });

  const handleDelete = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/generated-lessons/${id}`);
      toast({
        title: "Deleted",
        description: "Lesson removed successfully.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete lesson",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/live-session")}
              data-testid="button-back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-center flex-1">Generated Lessons</h1>
            <div className="w-10" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Information Section */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-700/50">
          <div className="flex gap-4">
            <BookOpen className="h-8 w-8 text-blue-400 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold mb-2">About Generated Lessons</h2>
              <p className="text-sm text-muted-foreground mb-3">
                "Save as Lesson" converts your recorded session into a structured learning resource. LEARNORY AI analyzes your transcript and automatically generates:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span><strong>Learning Objectives:</strong> Clear goals you'll achieve from this lesson</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span><strong>Key Points:</strong> Main concepts and important takeaways</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span><strong>Summary:</strong> Concise overview of the entire lesson</span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground mt-4">
                Use these lessons to build your course library or review topics you've studied.
              </p>
            </div>
          </div>
        </Card>

        {/* Lessons List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : lessons.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <p className="mb-4">No generated lessons yet</p>
            <p className="text-sm mb-4">Generate your first lesson by recording a session and clicking "Save as Lesson"</p>
            <Button onClick={() => setLocation("/live-session")}>
              Go to Live Session
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.map((lesson: GeneratedLesson) => (
              <Card key={lesson.id} className="p-6 flex flex-col gap-4 hover-elevate" data-testid={`lesson-card-${lesson.id}`}>
                <div>
                  <h3 className="font-semibold text-lg mb-2 truncate">{lesson.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(lesson.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Summary */}
                <div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{lesson.summary}</p>
                </div>

                {/* Objectives */}
                {lesson.objectives.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2 text-blue-400">Learning Objectives</p>
                    <div className="space-y-1">
                      {lesson.objectives.slice(0, 2).map((obj, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground">• {obj}</p>
                      ))}
                      {lesson.objectives.length > 2 && (
                        <p className="text-xs text-primary">+{lesson.objectives.length - 2} more</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Key Points */}
                {lesson.keyPoints.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2 text-green-400">Key Points</p>
                    <div className="space-y-1">
                      {lesson.keyPoints.slice(0, 2).map((point, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground">• {point}</p>
                      ))}
                      {lesson.keyPoints.length > 2 && (
                        <p className="text-xs text-primary">+{lesson.keyPoints.length - 2} more</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Delete Button */}
                <Button
                  onClick={() => handleDelete(lesson.id)}
                  size="sm"
                  variant="outline"
                  className="w-full hover-elevate active-elevate-2 text-destructive mt-auto"
                  data-testid={`button-delete-${lesson.id}`}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Lesson
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
