import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [selectedTab, setSelectedTab] = useState("files");
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: "Physics Study Guide",
      description: "Comprehensive physics notes",
      lastModified: "2 hours ago",
      files: 12,
      tasks: 5,
    },
    {
      id: 2,
      name: "Code Portfolio",
      description: "Personal coding projects",
      lastModified: "1 day ago",
      files: 24,
      tasks: 3,
    },
  ]);

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
        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {projects.map((project) => (
            <Card key={project.id} className="hover-elevate cursor-pointer" data-testid={`card-project-${project.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  <Badge variant="secondary">{project.lastModified}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-secondary/50 p-2 rounded text-center">
                    <p className="font-semibold text-primary">{project.files}</p>
                    <p className="text-xs text-muted-foreground">Files</p>
                  </div>
                  <div className="bg-secondary/50 p-2 rounded text-center">
                    <p className="font-semibold text-chart-2">{project.tasks}</p>
                    <p className="text-xs text-muted-foreground">Tasks</p>
                  </div>
                </div>

                <Button className="w-full hover-elevate" asChild data-testid={`button-open-project-${project.id}`}>
                  <a href="#">Open Project</a>
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Create New Project */}
          <Card className="hover-elevate cursor-pointer border-2 border-dashed border-primary/50 flex items-center justify-center min-h-48" data-testid="card-new-project">
            <div className="text-center">
              <Plus className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="font-semibold">New Project</p>
              <p className="text-sm text-muted-foreground mt-1">Create a new workspace</p>
            </div>
          </Card>
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
                <div className="space-y-2">
                  {["Complete study notes", "Review chapter 3", "Practice problems"].map((task, idx) => (
                    <div key={idx} className="p-3 bg-secondary/50 rounded flex items-center gap-3 hover-elevate">
                      <input type="checkbox" className="h-4 w-4" data-testid={`checkbox-task-${idx}`} />
                      <span className="text-sm font-medium flex-1">{task}</span>
                      <Badge>In Progress</Badge>
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
