import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useChatSessions, useProjects, useCreateChatSession } from "@/hooks/useSupabaseData";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Send,
  Loader2,
  Bot,
  User as UserIcon,
  FolderOpen,
  CheckCircle2,
  Circle,
  Mic,
  Image as ImageIcon,
  Search,
} from "lucide-react";
import { Link } from "wouter";

export default function AdvancedChat() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectContext, setProjectContext] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use Supabase hooks for faster data loading
  const { data: sessions = [], isLoading: sessionsLoading } = useChatSessions();
  const { data: projects = [] } = useProjects();
  const createSessionMutation = useCreateChatSession();

  useEffect(() => {
    if (user && sessions.length === 0 && !sessionsLoading && !isLoading && !createSessionMutation.isPending) {
      createSessionMutation.mutate({ title: "Advanced AI Workspace", mode: "chat" });
    }
  }, [user, sessions, sessionsLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Detect if user wants to read project workspace
  const shouldShowProjects = (text: string) => {
    const keywords = [
      "read my project",
      "show my projects",
      "my workspace",
      "read workspace",
      "project workspace",
      "read project",
      "project files",
      "analyze project",
    ];
    return keywords.some(k => text.toLowerCase().includes(k));
  };

  // Projects are already loaded via useProjects hook - no need to fetch again
  const loadProjects = () => {
    // projectsList is already available from the Supabase hook
  };

  const handleSelectProject = async (project: any) => {
    setSelectedProject(project);
    try {
      const response = await apiRequest("GET", `/api/projects/${project.id}/tasks`);
      const tasks = await response.json();
      
      const projectInfo = `**Project:** ${project.name}\n**Description:** ${project.description || "No description"}\n\n**Tasks (${tasks.length}):**\n${tasks
        .map((t: any) => `- ${t.status === "completed" ? "✓" : "○"} ${t.title}`)
        .join("\n")}`;
      
      setProjectContext(projectInfo);
      
      // Add assistant message about the project
      const assistantMessage = {
        role: "assistant",
        content: `I've loaded your project **${project.name}**! I'm using Gemini to analyze your workspace. Here's what I see:\n\n${projectInfo}\n\nHow can I help you with this project?`,
      };
      
      setMessages([...messages, assistantMessage]);
      setShowProjectSelector(false);
    } catch (error) {
      console.error("Failed to load project tasks:", error);
      toast({ title: "Error", description: "Failed to load project tasks", variant: "destructive" });
    }
  };

  const [searchInternet, setSearchInternet] = useState(false);

  const handleSendMessage = async () => {
    const trimmedMsg = message.trim();
    if (!trimmedMsg || isLoading) return;

    // ⚡ CRITICAL: Check FIRST if user wants to read projects - BEFORE doing anything else
    if (shouldShowProjects(trimmedMsg)) {
      // Add user message to UI
      const userMsg = { role: "user", content: trimmedMsg };
      setMessages((prev) => [...prev, userMsg]);
      
      // Clear input immediately
      setMessage("");
      
      // Load projects and show dialog
      setIsLoading(true);
      try {
        await loadProjects();
        setShowProjectSelector(true);
      } catch (error) {
        console.error("Failed to load projects:", error);
        toast({ title: "Error", description: "Failed to load projects", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
      
      // RETURN - DO NOT CONTINUE TO SEND TO BACKEND
      return;
    }

    // If we get here, it's NOT a project reading request - send to backend AI
    try {
      setIsLoading(true);
      const userMsg = { role: "user", content: trimmedMsg };
      setMessages((prev) => [...prev, userMsg]);
      setMessage("");

      // Build context if project is selected
      let systemContext = "You are an Advanced AI focused on helping with projects. Analyze context and provide accurate technical guidance.";
      if (projectContext) {
        systemContext += `\n\nUser is discussing this project:\n${projectContext}\n\n`;
      }

      const res = await apiRequest("POST", "/api/chat/send", {
        content: trimmedMsg,
        sessionId: sessions[0]?.id,
        context: systemContext,
        isAdvanced: true, // Signal for project/technical focus
        searchInternet: searchInternet, // Pass manual toggle state
      });

      const data = await res.json();
      
      const assistantMsg = {
        role: "assistant",
        content: data.message || data.response || "I'll help you with that!",
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background transition-all duration-700 ease-in-out animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border glassmorphism shadow-sm relative z-10">
        <div>
          <h1 className="text-2xl font-bold">Advanced Chat</h1>
          <p className="text-sm text-muted-foreground">
            Try: "read my project workspace" to discuss your projects
          </p>
        </div>
        {projectContext && (
          <Badge variant="outline" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            Project Active
          </Badge>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <Bot className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Start a conversation...</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <Card className={`max-w-[85%] p-4 glassmorphism border-primary/10 shadow-md transition-all duration-300 hover:shadow-primary/5 ${msg.role === "user" ? "bg-primary/10 ml-auto border-primary/30" : "mr-auto"}`}>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  {msg.role === "assistant" && <Bot className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" />}
                  {msg.role === "user" && <UserIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-secondary" />}
                  <div className="flex-1 whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                </div>
                
                {msg.attachments?.images?.map((img: any, i: number) => (
                  <div key={i} className="mt-2 rounded-lg overflow-hidden border border-border">
                    <img 
                      src={img.url} 
                      alt={img.title || "Generated image"} 
                      className="w-full h-auto object-cover max-h-64"
                    />
                    {img.title && (
                      <div className="p-2 bg-muted/50 text-xs text-muted-foreground">
                        {img.title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border space-y-2 glassmorphism bg-background/50 backdrop-blur-xl">
        <Textarea
          placeholder='Try "read my project workspace" to analyze your tasks...'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="resize-none bg-background/50 border-primary/20 focus-visible:ring-primary/30 transition-all duration-300"
          rows={3}
          data-testid="textarea-chat-input"
        />
        <div className="flex gap-2">
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className="gap-2"
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
            Send
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="hover-elevate"
            onClick={() => toast({ title: "Voice System", description: "Gemini Multimodal Live Voice API coming soon!" })}
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Link href="/project-workspace">
            <Button variant="outline" className="gap-2" data-testid="button-go-workspace">
              <FolderOpen className="w-4 h-4" />
              My Projects
            </Button>
          </Link>
          <Button 
            variant={searchInternet ? "default" : "outline"}
            className="gap-2"
            onClick={() => {
              const newState = !searchInternet;
              setSearchInternet(newState);
              toast({ 
                title: "Internet Search", 
                description: newState ? "Internet search enabled for this session." : "Internet search disabled." 
              });
            }}
            data-testid="button-toggle-search"
          >
            <Search className="w-4 h-4" />
            Search Internet
          </Button>
        </div>
      </div>

      {/* Project Selector Dialog */}
      <Dialog open={showProjectSelector} onOpenChange={setShowProjectSelector}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a Project to Discuss</DialogTitle>
            <DialogDescription>Choose a project and I'll read it for context</DialogDescription>
          </DialogHeader>

          {projects.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No projects yet</p>
              <Link href="/project-workspace">
                <Button variant="outline" data-testid="button-create-project">
                  Create Your First Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <Button
                  key={project.id}
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto p-3"
                  onClick={() => handleSelectProject(project)}
                  data-testid={`button-select-project-${project.id}`}
                >
                  <FolderOpen className="w-4 h-4 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-semibold">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.description || "No description"}</p>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
