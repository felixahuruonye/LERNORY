import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "wouter";
import {
  MessageSquare,
  Send,
  Paperclip,
  Mic,
  Image,
  Sparkles,
  Settings,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Copy,
  Trash2,
  ArrowLeft,
  Code2,
  BookOpen,
  Brain,
  Zap,
  Edit,
  MessageCircle,
  MoreVertical,
  Plus,
  FolderPlus,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdvancedChat() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedMode, setSelectedMode] = useState("chat");
  const [selectedAgent, setSelectedAgent] = useState("tutor");
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showFolderCreate, setShowFolderCreate] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const aiModes = [
    { id: "chat", name: "Chat", icon: MessageSquare, description: "General conversation" },
    { id: "write", name: "Writing", icon: BookOpen, description: "Content creation" },
    { id: "code", name: "Coding", icon: Code2, description: "Code assistance" },
    { id: "image", name: "Image Gen", icon: Image, description: "Create images" },
    { id: "math", name: "Math", icon: Zap, description: "Problem solving" },
    { id: "research", name: "Research", icon: Brain, description: "Deep research" },
  ];

  const agents = [
    { id: "tutor", name: "AI Tutor", icon: BookOpen, color: "bg-blue-500/10" },
    { id: "writer", name: "Content Writer", icon: Edit, color: "bg-purple-500/10" },
    { id: "programmer", name: "Code Expert", icon: Code2, color: "bg-green-500/10" },
    { id: "researcher", name: "Research Bot", icon: Brain, color: "bg-orange-500/10" },
    { id: "designer", name: "UI Designer", icon: Sparkles, color: "bg-pink-500/10" },
    { id: "automation", name: "Automation", icon: Zap, color: "bg-yellow-500/10" },
  ];

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat/send", {
        content: message,
        mode: selectedMode,
        agent: selectedAgent,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages([
        ...messages,
        { role: "user", content: inputValue },
        { role: "assistant", content: data.response },
      ]);
      setInputValue("");
    },
  });

  if (authLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header with Mode & Agent Selection */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild className="hover-elevate" data-testid="button-back-chat">
                <Link href="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <MessageSquare className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Advanced Chat</h1>
            </div>
            <ThemeToggle />
          </div>

          {/* Mode Tabs */}
          <Tabs defaultValue="chat" onValueChange={setSelectedMode} className="w-full">
            <TabsList className="grid grid-cols-6 w-full" data-testid="tabs-chat-modes">
              {aiModes.map((mode) => (
                <TabsTrigger key={mode.id} value={mode.id} className="hover-elevate text-xs sm:text-sm" data-testid={`tab-mode-${mode.id}`}>
                  <mode.icon className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">{mode.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="flex-1 flex gap-4 overflow-hidden p-4">
        {/* Agents Sidebar */}
        <div className="hidden lg:flex flex-col w-64 gap-3 overflow-y-auto">
          <Card className="hover-elevate" data-testid="card-agents">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Active Agents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all hover-elevate ${
                    selectedAgent === agent.id
                      ? "bg-primary/20 border-primary/50 border"
                      : `${agent.color} border border-transparent`
                  }`}
                  data-testid={`button-agent-${agent.id}`}
                >
                  <div className="flex items-center gap-2">
                    <agent.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{agent.name}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Conversations */}
          <Card className="flex-1 hover-elevate overflow-hidden flex flex-col" data-testid="card-conversations">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 overflow-y-auto flex-1">
              <Button variant="outline" size="sm" className="w-full hover-elevate justify-start" data-testid="button-new-conversation">
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-2 hover-elevate rounded text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors" data-testid={`item-conversation-${i}`}>
                  Conversation {i + 1}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Saved Messages */}
          <Card className="hover-elevate" data-testid="card-saved">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Saved Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full hover-elevate" data-testid="button-view-saved">
                View All
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Messages */}
          <Card className="flex-1 overflow-hidden flex flex-col hover-elevate" data-testid="card-messages">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                  <div>
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary opacity-50" />
                    <p className="text-lg font-semibold mb-2">Start a conversation</p>
                    <p className="text-sm">Ask me anything. I'm ready to help!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${idx}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-secondary text-secondary-foreground rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>

                    {msg.role === "assistant" && (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover-elevate"
                          data-testid={`button-copy-${idx}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover-elevate"
                          data-testid={`button-like-${idx}`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover-elevate"
                          data-testid={`button-dislike-${idx}`}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover-elevate"
                          data-testid={`button-bookmark-${idx}`}
                        >
                          <Bookmark className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-border/50 p-4 space-y-3">
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="hover-elevate"
                  data-testid="button-attach-file"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant={isRecording ? "default" : "outline"}
                  className="hover-elevate"
                  onClick={() => setIsRecording(!isRecording)}
                  data-testid="button-voice-input"
                >
                  <Mic className={`h-4 w-4 ${isRecording ? "animate-pulse" : ""}`} />
                </Button>
                <Input
                  placeholder={`Chat as ${selectedAgent}...`}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && inputValue.trim()) {
                      sendMessage.mutate(inputValue);
                    }
                  }}
                  className="flex-1"
                  data-testid="input-message"
                />
                <Button
                  size="icon"
                  className="hover-elevate"
                  onClick={() => sendMessage.mutate(inputValue)}
                  disabled={!inputValue.trim() || sendMessage.isPending}
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  {selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)} Mode
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {selectedAgent.charAt(0).toUpperCase() + selectedAgent.slice(1)}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
