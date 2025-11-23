import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "wouter";
import {
  ArrowLeft,
  Brain,
  Settings,
  ToggleLeft,
  BookOpen,
  Code2,
  Lightbulb,
  Zap,
  Palette,
  MessageSquare,
  Edit,
  Plus,
  Trash2,
  Copy,
} from "lucide-react";

export default function AgentsPanel() {
  const { user, isLoading: authLoading } = useAuth();
  const [agents, setAgents] = useState([
    {
      id: "tutor",
      name: "AI Tutor",
      description: "Explains concepts, creates exercises, grades assignments",
      icon: BookOpen,
      enabled: true,
      model: "GPT-4",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "writer",
      name: "Content Writer",
      description: "Writes essays, blog posts, creative content",
      icon: Edit,
      enabled: true,
      model: "GPT-4",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "programmer",
      name: "Code Expert",
      description: "Writes code, debugs, reviews, explains algorithms",
      icon: Code2,
      enabled: true,
      model: "GPT-4",
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "researcher",
      name: "Research Bot",
      description: "Researches topics, finds sources, summarizes info",
      icon: Lightbulb,
      enabled: true,
      model: "GPT-4",
      color: "from-orange-500 to-red-500",
    },
    {
      id: "designer",
      name: "UI Designer",
      description: "Creates UI mockups, designs, gives feedback",
      icon: Palette,
      enabled: true,
      model: "Claude 3",
      color: "from-pink-500 to-rose-500",
    },
    {
      id: "automation",
      name: "Automation Bot",
      description: "Automates workflows, schedules tasks, integrations",
      icon: Zap,
      enabled: false,
      model: "Custom",
      color: "from-yellow-500 to-amber-500",
    },
  ]);

  if (authLoading || !user) {
    return <div>Loading...</div>;
  }

  const toggleAgent = (id: string) => {
    setAgents(agents.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  };

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
                <h1 className="text-2xl font-bold">Agent Management</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="hover-elevate" data-testid="card-active-agents">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">5</p>
                <p className="text-sm text-muted-foreground mt-1">Active Agents</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-total-agents">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-chart-2">6</p>
                <p className="text-sm text-muted-foreground mt-1">Total Agents</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-custom-agents">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-chart-3">0</p>
                <p className="text-sm text-muted-foreground mt-1">Custom Agents</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Custom Agent */}
        <Card className="mb-8 hover-elevate border-dashed border-2 border-primary/50" data-testid="card-create-agent">
          <CardContent className="pt-6">
            <Button size="lg" className="w-full hover-elevate" data-testid="button-create-custom-agent">
              <Plus className="h-5 w-5 mr-2" />
              Create Custom Agent
            </Button>
          </CardContent>
        </Card>

        {/* Agents Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className={`hover-elevate overflow-hidden transition-all ${
                !agent.enabled ? "opacity-60" : ""
              }`}
              data-testid={`card-agent-${agent.id}`}
            >
              <div className={`bg-gradient-to-r ${agent.color} p-4`}>
                <div className="flex items-start justify-between">
                  <agent.icon className="h-8 w-8 text-white" />
                  <Switch
                    checked={agent.enabled}
                    onCheckedChange={() => toggleAgent(agent.id)}
                    data-testid={`toggle-agent-${agent.id}`}
                  />
                </div>
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{agent.name}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{agent.description}</p>

                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{agent.model}</Badge>
                  <Badge variant="outline" className={agent.enabled ? "" : "opacity-50"}>
                    {agent.enabled ? "Active" : "Disabled"}
                  </Badge>
                </div>

                <div className="space-y-2 pt-3 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full hover-elevate"
                    asChild
                    data-testid={`button-customize-${agent.id}`}
                  >
                    <a href="#">
                      <Settings className="h-4 w-4 mr-2" />
                      Customize
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full hover-elevate"
                    data-testid={`button-copy-settings-${agent.id}`}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Settings
                  </Button>
                  {!["tutor", "writer", "programmer"].includes(agent.id) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full hover-elevate"
                      data-testid={`button-delete-${agent.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Agent Configuration */}
        <Card className="mt-8 hover-elevate" data-testid="card-configuration">
          <CardHeader>
            <CardTitle>Global Agent Settings</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-semibold block mb-3">Default AI Model</label>
              <select className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm" data-testid="select-default-model">
                <option>GPT-4</option>
                <option>GPT-3.5</option>
                <option>Claude 3</option>
                <option>Custom</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-3">Response Timeout</label>
              <input
                type="number"
                min="10"
                max="120"
                defaultValue="30"
                className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm"
                data-testid="input-response-timeout"
              />
              <p className="text-xs text-muted-foreground mt-1">Seconds</p>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-3 flex items-center gap-2">
                <ToggleLeft className="h-4 w-4" />
                Enable Agent Collaboration
              </label>
              <Switch defaultChecked data-testid="switch-agent-collab" />
            </div>

            <Button className="w-full hover-elevate" data-testid="button-save-settings">
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
