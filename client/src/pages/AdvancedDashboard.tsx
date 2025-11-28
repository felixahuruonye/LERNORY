import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "wouter";
import {
  Search,
  Sparkles,
  MessageSquare,
  Code2,
  Mic,
  ImageIcon,
  Brain,
  Zap,
  Clock,
  FolderOpen,
  Settings,
  LogOut,
  Monitor,
  Bell,
} from "lucide-react";

export default function AdvancedDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="animate-pulse text-muted-foreground">Loading LERNORY...</div>
      </div>
    );
  }

  // AI Tools Hub
  const aiTools = [
    { id: "chat", name: "Advanced Chat", icon: MessageSquare, description: "Multi-mode conversational AI", color: "from-blue-500 to-cyan-500", href: "/advanced-chat" },
    { id: "website", name: "Website Generator", icon: Code2, description: "AI-powered code generation", color: "from-green-500 to-emerald-500", href: "/website-generator" },
    { id: "live", name: "Live Session", icon: Mic, description: "Real-time transcription & recording", color: "from-rose-500 to-pink-500", href: "/live-session" },
    { id: "image", name: "Image Generation", icon: ImageIcon, description: "DALL-E & image tools", color: "from-orange-500 to-red-500", href: "/image-gen" },
    { id: "memory", name: "Memory Panel", icon: Brain, description: "Learning memory system", color: "from-teal-500 to-cyan-500", href: "/memory" },
    { id: "cbt", name: "CBT Mode", icon: Monitor, description: "Exam simulation (JAMB/WAEC/NECO)", color: "from-amber-500 to-yellow-500", href: "/cbt-mode" },
    { id: "workspace", name: "Project Workspace", icon: FolderOpen, description: "Organize your projects", color: "from-purple-500 to-pink-500", href: "/project-workspace" },
    { id: "settings", name: "Settings", icon: Settings, description: "Customize your experience", color: "from-indigo-500 to-blue-500", href: "/settings" },
  ];

  // Quick Actions
  const quickActions = [
    { label: "Ask LEARNORY", icon: MessageSquare, href: "/advanced-chat", color: "bg-blue-500/10" },
    { label: "Generate Website", icon: Code2, href: "/website-generator", color: "bg-emerald-500/10" },
    { label: "Live Session", icon: Mic, href: "/live-session", color: "bg-rose-500/10" },
    { label: "Generate Image", icon: ImageIcon, href: "/image-gen", color: "bg-orange-500/10" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                LERNORY ULTRA
              </h1>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search modes, projects, tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-primary/20 focus:border-primary/50"
                data-testid="input-search-dashboard"
              />
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="ghost" size="icon" asChild className="hover-elevate relative" data-testid="link-notifications">
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild className="hover-elevate" data-testid="link-settings">
                <Link href="/settings">
                  <Settings className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" asChild className="hover-elevate active-elevate-2" data-testid="button-logout">
                <a href="/api/logout" className="gap-2">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-4xl font-bold">Welcome back, {user.firstName || user.email}!</h2>
            <Sparkles className="h-8 w-8 text-primary animate-bounce" />
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {new Date().toLocaleDateString()} • Ready to learn something new?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Card className={`${action.color} hover-elevate cursor-pointer h-full transition-all`} data-testid={`card-action-${action.label.toLowerCase().replace(" ", "-")}`}>
                <div className="p-6 text-center">
                  <action.icon className="h-8 w-8 mx-auto mb-2 text-foreground" />
                  <p className="font-semibold text-sm">{action.label}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* AI Tools Hub */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            AI Tools Hub
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiTools.map((tool) => (
              <Card
                key={tool.id}
                className="hover-elevate cursor-pointer transition-all group relative overflow-hidden"
                onMouseEnter={() => setHoveredCard(tool.id)}
                onMouseLeave={() => setHoveredCard(null)}
                data-testid={`card-tool-${tool.id}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                <CardHeader className="relative">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${tool.color} mb-3`}>
                    <tool.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-sm text-muted-foreground mb-4">{tool.description}</p>
                  <Button
                    size="sm"
                    className="w-full hover-elevate"
                    asChild
                    data-testid={`button-open-${tool.id}`}
                  >
                    <Link href={tool.href || "/advanced-chat"}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Get Started Button */}
        <div className="mt-12">
          <Link href="/advanced-chat">
            <Button className="gap-2" size="lg" data-testid="button-get-started">
              <Sparkles className="h-5 w-5" />
              Start Learning Now
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
