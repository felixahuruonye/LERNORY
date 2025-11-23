import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "wouter";
import {
  ArrowLeft,
  Settings,
  Moon,
  Sun,
  Palette,
  Lock,
  Bell,
  Download,
  Zap,
  Keyboard,
} from "lucide-react";

export default function SettingsPanel() {
  const { user, isLoading: authLoading } = useAuth();
  const [theme, setTheme] = useState("dark");
  const [notifications, setNotifications] = useState({
    messages: true,
    suggestions: true,
    updates: false,
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const settings = [
    {
      title: "Appearance",
      icon: Palette,
      items: [
        {
          label: "Theme",
          description: "Light, Dark, or Neon mode",
          component: (
            <div className="flex gap-2" data-testid="select-theme">
              {["Light", "Dark", "Neon"].map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={theme === t.toLowerCase() ? "default" : "outline"}
                  onClick={() => setTheme(t.toLowerCase())}
                  className="hover-elevate"
                >
                  {t}
                </Button>
              ))}
            </div>
          ),
        },
      ],
    },
    {
      title: "Notifications",
      icon: Bell,
      items: [
        {
          label: "Message Notifications",
          description: "Get notified when you receive messages",
          component: (
            <Switch
              checked={notifications.messages}
              onCheckedChange={(val) =>
                setNotifications({ ...notifications, messages: val })
              }
              data-testid="switch-message-notifications"
            />
          ),
        },
        {
          label: "AI Suggestions",
          description: "Receive suggestions and recommendations",
          component: (
            <Switch
              checked={notifications.suggestions}
              onCheckedChange={(val) =>
                setNotifications({ ...notifications, suggestions: val })
              }
              data-testid="switch-suggestion-notifications"
            />
          ),
        },
        {
          label: "Product Updates",
          description: "Learn about new features",
          component: (
            <Switch
              checked={notifications.updates}
              onCheckedChange={(val) =>
                setNotifications({ ...notifications, updates: val })
              }
              data-testid="switch-update-notifications"
            />
          ),
        },
      ],
    },
    {
      title: "Privacy & Data",
      icon: Lock,
      items: [
        {
          label: "Data Collection",
          description: "Allow LERNORY to analyze learning patterns",
          component: <Switch defaultChecked data-testid="switch-data-collection" />,
        },
        {
          label: "Shared Learning",
          description: "Share insights with teachers (if student)",
          component: <Switch defaultChecked data-testid="switch-shared-learning" />,
        },
      ],
    },
    {
      title: "Data Management",
      icon: Download,
      items: [
        {
          label: "Export Data",
          description: "Download all your data in JSON format",
          component: (
            <Button variant="outline" size="sm" className="hover-elevate" data-testid="button-export-data">
              Export
            </Button>
          ),
        },
        {
          label: "Download Backups",
          description: "Create and download backup files",
          component: (
            <Button variant="outline" size="sm" className="hover-elevate" data-testid="button-download-backups">
              Backup
            </Button>
          ),
        },
      ],
    },
    {
      title: "Performance",
      icon: Zap,
      items: [
        {
          label: "Low-End Device Mode",
          description: "Optimize for slower devices",
          component: <Switch data-testid="switch-low-end-mode" />,
        },
        {
          label: "Reduce Animations",
          description: "Minimize motion and transitions",
          component: <Switch data-testid="switch-reduce-animations" />,
        },
      ],
    },
    {
      title: "Keyboard Shortcuts",
      icon: Keyboard,
      items: [
        {
          label: "Open Search",
          description: "Cmd/Ctrl + K",
          component: <Badge>Cmd K</Badge>,
        },
        {
          label: "New Chat",
          description: "Cmd/Ctrl + N",
          component: <Badge>Cmd N</Badge>,
        },
        {
          label: "Open Settings",
          description: "Cmd/Ctrl + ,",
          component: <Badge>Cmd ,</Badge>,
        },
      ],
    },
  ];

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
                <Settings className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Settings</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Settings Sections */}
        <div className="space-y-6">
          {settings.map((section) => (
            <Card key={section.title} className="hover-elevate transition-all" data-testid={`card-settings-${section.title.toLowerCase().replace(" ", "-")}`}>
              <div className="flex items-center gap-3 p-6 border-b border-border/50">
                <section.icon className="h-6 w-6 text-primary" />
                <CardTitle>{section.title}</CardTitle>
              </div>

              <CardContent className="divide-y divide-border/50">
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-6">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    </div>
                    <div className="ml-4">{item.component}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Danger Zone */}
        <Card className="mt-8 border-red-500/50">
          <CardHeader>
            <CardTitle className="text-red-500">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="destructive" className="hover-elevate" data-testid="button-reset-account">
              Reset Account
            </Button>
            <Button variant="destructive" className="hover-elevate" data-testid="button-delete-account">
              Delete Account Permanently
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
