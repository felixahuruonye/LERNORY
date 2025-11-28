import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "wouter";
import {
  ArrowLeft,
  FolderOpen,
  Plus,
  Trash2,
  HelpCircle,
  CheckCircle2,
  Circle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ProjectWorkspace() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadProjects();
    }
  }, [authLoading, user]);

  const loadProjects = async () => {
    try {
      const response = await apiRequest("GET", "/api/projects");
      const data = await response.json();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProject(data[0]);
        loadProjectTasks(data[0].id);
      }
    } catch (error) {
      console.error("Load projects error:", error);
      toast({ title: "Error", description: "Failed to load projects", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectTasks = async (projectId: string) => {
    try {
      const response = await apiRequest("GET", `/api/projects/${projectId}/tasks`);
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Load tasks error:", error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast({ title: "Error", description: "Project name cannot be empty", variant: "destructive" });
      return;
    }
    try {
      const response = await apiRequest("POST", "/api/projects", { name: newProjectName, description: "" });
      const newProject = await response.json();
      setProjects([...projects, newProject]);
      setSelectedProject(newProject);
      setNewProjectName("");
      await loadProjectTasks(newProject.id);
      toast({ title: "Success", description: "Project created successfully!", variant: "default" });
    } catch (error) {
      console.error("Create project error:", error);
      toast({ title: "Error", description: "Failed to create project", variant: "destructive" });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await apiRequest("DELETE", `/api/projects/${projectId}`, {});
      const newProjects = projects.filter(p => p.id !== projectId);
      setProjects(newProjects);
      if (selectedProject?.id === projectId) {
        if (newProjects.length > 0) {
          setSelectedProject(newProjects[0]);
          await loadProjectTasks(newProjects[0].id);
        } else {
          setSelectedProject(null);
          setTasks([]);
        }
      }
      toast({ title: "Success", description: "Project deleted", variant: "default" });
    } catch (error) {
      console.error("Delete project error:", error);
      toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
    }
  };

  const handleCreateTask = async () => {
    if (!selectedProject) {
      toast({ title: "Error", description: "Please select a project first", variant: "destructive" });
      return;
    }
    if (!newTaskTitle.trim()) {
      toast({ title: "Error", description: "Task title cannot be empty", variant: "destructive" });
      return;
    }
    try {
      const response = await apiRequest("POST", `/api/projects/${selectedProject.id}/tasks`, { 
        title: newTaskTitle, 
        status: "pending" 
      });
      const newTask = await response.json();
      setTasks([...tasks, newTask]);
      setNewTaskTitle("");
      toast({ title: "Success", description: "Task created!", variant: "default" });
    } catch (error) {
      console.error("Create task error:", error);
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      const response = await apiRequest("PATCH", `/api/tasks/${taskId}`, { status: newStatus });
      const updated = await response.json();
      setTasks(tasks.map(t => t.id === taskId ? updated : t));
      toast({ title: "Success", description: `Task marked as ${newStatus}`, variant: "default" });
    } catch (error) {
      console.error("Update task error:", error);
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiRequest("DELETE", `/api/tasks/${taskId}`, {});
      setTasks(tasks.filter(t => t.id !== taskId));
      toast({ title: "Success", description: "Task deleted", variant: "default" });
    } catch (error) {
      console.error("Delete task error:", error);
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    }
  };

  if (authLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const completedCount = tasks.filter(t => t.status === "completed").length;
  const totalCount = tasks.length;

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
                <FolderOpen className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Project Workspace</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowInstructions(true)}
                data-testid="button-help"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create New Project Section */}
        <Card className="mb-8 hover-elevate">
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
            <CardDescription>Start organizing your work with a new project</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="Enter project name (e.g., Physics Study, Math Notes)..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreateProject()}
              data-testid="input-new-project"
              className="flex-1"
            />
            <Button 
              onClick={handleCreateProject}
              data-testid="button-create-project"
              className="min-w-32"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {projects.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3 hover-elevate">
              <CardContent className="pt-6 text-center text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No projects yet. Create one to get started!</p>
              </CardContent>
            </Card>
          ) : (
            projects.map((project) => (
              <Card 
                key={project.id}
                className={`hover-elevate cursor-pointer transition-all ${
                  selectedProject?.id === project.id ? 'border-primary border-2' : ''
                }`}
                onClick={() => {
                  setSelectedProject(project);
                  loadProjectTasks(project.id);
                }}
                data-testid={`card-project-${project.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg flex-1">{project.name}</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      data-testid={`button-delete-project-${project.id}`}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  <Badge variant="secondary" className="mb-2">
                    {totalCount} tasks
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Selected Project Tasks */}
        {selectedProject && (
          <Card className="hover-elevate">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedProject.name} - Tasks</CardTitle>
                  <CardDescription>
                    {completedCount} of {totalCount} tasks completed
                  </CardDescription>
                </div>
                {totalCount > 0 && (
                  <Badge variant="outline" className="text-lg">
                    {Math.round((completedCount / totalCount) * 100)}%
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Add New Task */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new task (e.g., Review Chapter 5)..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleCreateTask()}
                  data-testid="input-new-task"
                  className="flex-1"
                />
                <Button 
                  onClick={handleCreateTask}
                  data-testid="button-add-task"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              {/* Tasks List */}
              <div className="space-y-2 mt-6">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No tasks yet. Add one to get started!</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div 
                      key={task.id}
                      className="p-4 bg-secondary/30 rounded-lg flex items-center gap-3 hover-elevate group transition-all"
                      data-testid={`task-item-${task.id}`}
                    >
                      <button
                        onClick={() => handleToggleTask(task.id, task.status)}
                        className="flex-shrink-0 hover-elevate"
                        data-testid={`button-toggle-task-${task.id}`}
                      >
                        {task.status === "completed" ? (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground" />
                        )}
                      </button>
                      
                      <span 
                        className={`flex-1 font-medium ${
                          task.status === "completed" 
                            ? "text-muted-foreground line-through" 
                            : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </span>

                      <Badge 
                        variant={task.status === "completed" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {task.status}
                      </Badge>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTask(task.id)}
                        data-testid={`button-delete-task-${task.id}`}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedProject && projects.length > 0 && (
          <Card className="hover-elevate">
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>Select a project above to view and manage its tasks</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Instructions Modal */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Project Workspace Guide</DialogTitle>
            <DialogDescription>Learn how to use this workspace to organize your studies</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge className="text-lg">1</Badge>
                <h3 className="font-semibold text-lg">Create a Project</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-10">
                Enter a project name (like "Physics Study Guide" or "Math Homework") in the input field and click "Create Project". This will be your workspace for organizing related tasks.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge className="text-lg">2</Badge>
                <h3 className="font-semibold text-lg">Select a Project</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-10">
                Click on any project card in the grid to select it. The selected project will appear highlighted. Its tasks will display below.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge className="text-lg">3</Badge>
                <h3 className="font-semibold text-lg">Add Tasks</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-10">
                Type a task name (like "Review Chapter 5" or "Complete Practice Problems") in the task input and press Enter or click "Add". Tasks help you break down your project into smaller, manageable pieces.
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge className="text-lg">4</Badge>
                <h3 className="font-semibold text-lg">Track Progress</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-10">
                Click the circle icon next to a task to mark it as complete. Completed tasks will show a green checkmark. Your progress percentage displays at the top.
              </p>
            </div>

            {/* Step 5 */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge className="text-lg">5</Badge>
                <h3 className="font-semibold text-lg">Delete Tasks or Projects</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-10">
                Hover over a task to see the delete button, or click the trash icon on a project card to remove it. Deleted items cannot be recovered.
              </p>
            </div>

            {/* Tips */}
            <div className="bg-primary/10 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold">Tips for Best Results:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Use clear, descriptive project names (e.g., "Biology Semester" not "Bio")</li>
                <li>• Break large tasks into smaller, actionable items</li>
                <li>• Update task status regularly to track your progress</li>
                <li>• Create new projects for each subject or exam to stay organized</li>
              </ul>
            </div>
          </div>

          <Button 
            onClick={() => setShowInstructions(false)}
            className="w-full"
            data-testid="button-close-instructions"
          >
            Got it!
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
