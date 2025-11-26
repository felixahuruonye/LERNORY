import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Send,
  MessageSquare,
  Plus,
  Trash2,
  Menu,
  ChevronLeft,
  ArrowLeft,
  Loader2,
  Bot,
  User as UserIcon,
  Volume2,
  VolumeX,
  Settings,
  Bell,
  Zap,
  CheckSquare,
  Square,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useVoice } from "@/lib/useVoice";
import type { ChatMessage, ChatSession } from "@shared/schema";

export default function Chat() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { toggleSpeak, isPlaying } = useVoice();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [historyTab, setHistoryTab] = useState("all"); // "all" or "manage"
  const [selectedChatsForDelete, setSelectedChatsForDelete] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat sessions
  const { data: sessions = [] } = useQuery<ChatSession[]>({
    queryKey: ["/api/chat/sessions"],
    enabled: !!user,
  });

  // Load messages for current session
  const { data: messages = [], refetch: refetchMessages } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages", currentSessionId],
    enabled: !!user && !!currentSessionId,
    queryFn: async () => {
      const res = await fetch(`/api/chat/messages?sessionId=${currentSessionId}`);
      if (!res.ok) throw new Error("Failed to load messages");
      const data = await res.json();
      return data.sort((a: ChatMessage, b: ChatMessage) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeA - timeB;
      });
    },
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set first session or create new one
  useEffect(() => {
    if (user && !currentSessionId) {
      if (sessions.length > 0) {
        setCurrentSessionId(sessions[0].id);
      } else {
        createNewChat();
      }
    }
  }, [user, sessions, currentSessionId]);

  // Create new chat
  const createNewChat = async () => {
    try {
      const res = await apiRequest("POST", "/api/chat/sessions", {
        title: "New Chat",
        mode: "chat",
      });
      const session = await res.json();
      setCurrentSessionId(session.id);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      toast({ title: "New chat created" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create chat", variant: "destructive" });
    }
  };

  // Delete single chat
  const deleteChat = async (sessionId: string) => {
    try {
      await apiRequest("DELETE", `/api/chat/sessions/${sessionId}`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
      toast({ title: "Chat deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete chat", variant: "destructive" });
    }
  };

  // Bulk delete chats
  const bulkDeleteChats = async () => {
    if (selectedChatsForDelete.size === 0) {
      toast({ title: "No chats selected", variant: "destructive" });
      return;
    }

    try {
      await apiRequest("POST", "/api/chat/sessions/bulk-delete", {
        sessionIds: Array.from(selectedChatsForDelete),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      setSelectedChatsForDelete(new Set());
      if (selectedChatsForDelete.has(currentSessionId || "")) {
        setCurrentSessionId(null);
      }
      toast({ title: `Deleted ${selectedChatsForDelete.size} chats` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete chats", variant: "destructive" });
    }
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedChatsForDelete.size === sessions.length) {
      setSelectedChatsForDelete(new Set());
    } else {
      setSelectedChatsForDelete(new Set(sessions.map(s => s.id)));
    }
  };

  // Toggle individual chat selection
  const toggleChatSelection = (sessionId: string) => {
    const newSelected = new Set(selectedChatsForDelete);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedChatsForDelete(newSelected);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!message.trim() || !currentSessionId || isLoading) return;

    try {
      setIsLoading(true);
      const res = await apiRequest("POST", "/api/chat/send", {
        content: message.trim(),
        sessionId: currentSessionId,
        autoLearn: true, // Enable auto-learning
      });
      await res.json();

      await refetchMessages();
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      setMessage("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 border-r border-border flex flex-col overflow-hidden`}
      >
        {/* New Chat Button */}
        <div className="p-4 border-b border-border">
          <Button
            onClick={createNewChat}
            className="w-full"
            data-testid="button-new-chat"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* History Tabs */}
        <div className="flex gap-1 p-3 border-b border-border">
          <button
            onClick={() => setHistoryTab("all")}
            className={`flex-1 text-xs font-semibold py-2 rounded transition-colors ${
              historyTab === "all"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-history-all"
          >
            All
          </button>
          <button
            onClick={() => setHistoryTab("manage")}
            className={`flex-1 text-xs font-semibold py-2 rounded transition-colors ${
              historyTab === "manage"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-history-manage"
          >
            Manage
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {historyTab === "all" ? (
            // All chats view
            <>
              {sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No chats yet</p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                      currentSessionId === session.id
                        ? "bg-primary/20 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <button
                      onClick={() => setCurrentSessionId(session.id)}
                      className="flex-1 text-left text-sm truncate min-w-0"
                      title={session.title}
                      data-testid={`button-session-${session.id}`}
                    >
                      {session.title}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${session.title}"?`)) {
                          deleteChat(session.id);
                        }
                      }}
                      className="p-1 text-destructive hover:bg-destructive/20 rounded transition-colors"
                      data-testid={`button-delete-${session.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </>
          ) : (
            // Manage chats view with checkboxes
            <>
              {sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No chats to manage</p>
              ) : (
                <>
                  {/* Select All Button */}
                  <button
                    onClick={toggleSelectAll}
                    className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors mb-2 text-sm font-semibold"
                    data-testid="button-select-all-chats"
                  >
                    {selectedChatsForDelete.size === sessions.length ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-xs">
                      {selectedChatsForDelete.size > 0 ? `${selectedChatsForDelete.size} selected` : "Select All"}
                    </span>
                  </button>

                  {/* Chat List with Checkboxes */}
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors"
                    >
                      <button
                        onClick={() => toggleChatSelection(session.id)}
                        className="flex-shrink-0"
                        data-testid={`checkbox-session-${session.id}`}
                      >
                        {selectedChatsForDelete.has(session.id) ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                      <span className="flex-1 text-sm truncate">{session.title}</span>
                    </div>
                  ))}

                  {/* Bulk Delete Button */}
                  {selectedChatsForDelete.size > 0 && (
                    <button
                      onClick={bulkDeleteChats}
                      className="w-full mt-4 flex items-center justify-center gap-2 p-2 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors text-sm font-semibold"
                      data-testid="button-bulk-delete-chats"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete {selectedChatsForDelete.size}
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="button-toggle-sidebar"
              >
                {sidebarOpen ? (
                  <ChevronLeft className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
              <h1 className="font-semibold text-lg">LEARNORY</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/settings">
                <Button variant="ghost" size="icon" data-testid="link-settings">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/live-ai">
                <Button variant="ghost" size="icon" data-testid="link-live-ai" className="text-purple-400 hover:text-purple-300">
                  <Zap className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" data-testid="link-back">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Start a conversation</h2>
              <p className="text-muted-foreground max-w-md">
                Ask me anything about your studies. I can help with explanations, problem-solving, exam prep, and more.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                  data-testid={`message-${msg.role}-${msg.id}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-2xl rounded-lg p-4 backdrop-blur-md transition-all duration-300 ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-primary/90 to-primary/70 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40"
                        : "bg-gradient-to-br from-muted/80 to-muted/60 text-foreground border border-border/50 shadow-lg shadow-black/10 dark:shadow-black/30 hover:shadow-black/20 dark:hover:shadow-black/40"
                    }`}
                    data-testid={`card-message-${msg.id}`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <p className="whitespace-pre-wrap break-words text-sm flex-1">
                        {msg.content}
                      </p>
                      {msg.role === "assistant" && (
                        <button
                          onClick={() => {
                            setPlayingMessageId(
                              playingMessageId === msg.id ? null : msg.id
                            );
                            toggleSpeak(msg.content);
                          }}
                          className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 ${
                            playingMessageId === msg.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-primary/20"
                          }`}
                          title={
                            playingMessageId === msg.id ? "Stop" : "Read aloud"
                          }
                          data-testid={`button-speak-${msg.id}`}
                        >
                          {playingMessageId === msg.id ? (
                            <VolumeX className="w-4 h-4" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {msg.role === "user" && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-background p-4">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Shift+Enter for new line)"
              className="flex-1 resize-none"
              rows={3}
              disabled={isLoading}
              data-testid="input-message"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              size="icon"
              className="self-end"
              data-testid="button-send"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
