import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "wouter";
import {
  ArrowLeft,
  FolderOpen,
  FileText,
  Code,
  CheckSquare,
  History,
  Download,
  Plus,
  Trash2,
  GitBranch,
  Eye,
  Edit3,
  Brain,
} from "lucide-react";

export default function ProjectWorkspace() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("files");
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await apiRequest("GET", "/api/projects");
      const data = await response.json();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProject(data[0]);
        loadProjectData(data[0].id);
      }
    } catch (error) {
      console.error("Load projects error:", error);
      toast({ title: "Error", description: "Failed to load projects", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectData = async (projectId: string) => {
    try {
      const [filesRes, tasksRes] = await Promise.all([
        apiRequest("GET", `/api/projects/${projectId}/files`),
        apiRequest("GET", `/api/projects/${projectId}/tasks`),
      ]);
      const filesData = await filesRes.json();
      const tasksData = await tasksRes.json();
      setFiles(filesData);
      setTasks(tasksData);
    } catch (error) {
      console.error("Load project data error:", error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const project = await apiRequest("POST", "/api/projects", { name: newProjectName, description: "" });
      const newProject = await project.json();
      setProjects([...projects, newProject]);
      setSelectedProject(newProject);
      setNewProjectName("");
      await loadProjectData(newProject.id);
      toast({ title: "Success", description: "Project created" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create project", variant: "destructive" });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await apiRequest("DELETE", `/api/projects/${projectId}`, {});
      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        const newSelected = projects[0];
        setSelectedProject(newSelected);
        if (newSelected) loadProjectData(newSelected.id);
      }
      toast({ title: "Success", description: "Project deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
    }
  };

  const handleCreateTask = async (title: string) => {
    if (!selectedProject) return;
    try {
      const task = await apiRequest("POST", `/api/projects/${selectedProject.id}/tasks`, { title, status: "pending" });
      const newTask = await task.json();
      setTasks([...tasks, newTask]);
      toast({ title: "Success", description: "Task created" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    }
  };

  const handleUpdateTask = async (taskId: string, updates: any) => {
    try {
      const task = await apiRequest("PATCH", `/api/tasks/${taskId}`, updates);
      const updated = await task.json();
      setTasks(tasks.map(t => t.id === taskId ? updated : t));
    } catch (error) {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiRequest("DELETE", `/api/tasks/${taskId}`, {});
      setTasks(tasks.filter(t => t.id !== taskId));
      toast({ title: "Success", description: "Task deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    }
  };

  if (authLoading || !user) {
    return <div>Loading...</div>;
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
                <FolderOpen className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Project Workspace</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create New Project */}
        <div className="mb-8 flex gap-2">
          <Input
            placeholder="New project name..."
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCreateProject()}
            data-testid="input-new-project"
          />
          <Button onClick={handleCreateProject} data-testid="button-create-project">
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className={`hover-elevate cursor-pointer ${selectedProject?.id === project.id ? 'border-primary' : ''}`}
              onClick={() => {
                setSelectedProject(project);
                loadProjectData(project.id);
              }}
              data-testid={`card-project-${project.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    data-testid={`button-delete-project-${project.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-secondary/50 p-2 rounded text-center">
                    <p className="font-semibold text-primary">{files.length}</p>
                    <p className="text-xs text-muted-foreground">Files</p>
                  </div>
                  <div className="bg-secondary/50 p-2 rounded text-center">
                    <p className="font-semibold text-chart-2">{tasks.length}</p>
                    <p className="text-xs text-muted-foreground">Tasks</p>
                  </div>
                </div>

                <Badge variant="secondary">Open Project</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Project Details */}
        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle>Project Management</CardTitle>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="files" onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="files" data-testid="tab-files">
                  <FileText className="h-4 w-4 mr-2" />
                  Files
                </TabsTrigger>
                <TabsTrigger value="editor" data-testid="tab-editor">
                  <Code className="h-4 w-4 mr-2" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="tasks" data-testid="tab-tasks">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="history" data-testid="tab-history">
                  <History className="h-4 w-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="files" className="space-y-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Project Files</h3>
                  <Button size="sm" className="hover-elevate" data-testid="button-upload-file">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
                <div className="space-y-2">
                  {["notes.md", "code.js", "styles.css"].map((file) => (
                    <div key={file} className="p-3 bg-secondary/50 rounded flex items-center justify-between hover-elevate">
                      <span className="text-sm font-medium">{file}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" data-testid={`button-edit-${file}`}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" data-testid={`button-delete-${file}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="editor" className="space-y-4 mt-4">
                <div className="bg-secondary/50 rounded p-4 font-mono text-sm h-64 overflow-auto">
                  <pre>{`// Code Editor
function hello() {
  console.log("Hello, LERNORY!");
}`}</pre>
                </div>
                <Button className="w-full hover-elevate" data-testid="button-save-code">
                  Save Code
                </Button>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-4 mt-4">
                <div className="flex gap-2 mb-4">
                  <Input placeholder="Add new task..." data-testid="input-new-task" onKeyPress={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      handleCreateTask(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }} />
                </div>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-3 bg-secondary/50 rounded flex items-center gap-3 hover-elevate">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4" 
                        checked={task.status === "completed"}
                        onChange={() => handleUpdateTask(task.id, { status: task.status === "completed" ? "pending" : "completed" })}
                        data-testid={`checkbox-task-${task.id}`} 
                      />
                      <span className="text-sm font-medium flex-1">{task.title}</span>
                      <Badge>{task.status}</Badge>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteTask(task.id)} data-testid={`button-delete-task-${task.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4 mt-4">
                <div className="space-y-2">
                  {["Updated notes", "Added code section", "Fixed typos"].map((change, idx) => (
                    <div key={idx} className="p-3 bg-secondary/50 rounded text-sm hover-elevate">
                      <p className="font-medium">{change}</p>
                      <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card className="mt-8 hover-elevate">
          <CardHeader>
            <CardTitle>Export Project</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <Button variant="outline" className="hover-elevate" data-testid="button-export-pdf">
              <Download className="h-4 w-4 mr-2" />
              Export as PDF
            </Button>
            <Button variant="outline" className="hover-elevate" data-testid="button-export-docx">
              <Download className="h-4 w-4 mr-2" />
              Export as DOCX
            </Button>
            <Button variant="outline" className="hover-elevate" data-testid="button-export-html">
              <Download className="h-4 w-4 mr-2" />
              Export as HTML
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
