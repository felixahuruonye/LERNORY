import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Mic,
  Send,
  Paperclip,
  Volume2,
  Loader2,
  Bot,
  User,
  Plus,
  MoreVertical,
  Trash2,
  BookmarkIcon,
  Settings,
  Heart,
  RotateCcw,
  ChevronDown,
  Highlighter,
  MessageSquare,
  Zap,
  Download,
  Copy,
  Flag,
  BookOpen,
  Code,
  Wand2,
  MessageCircle,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ChatMessage, ChatSession } from "@shared/schema";
import { useDropzone } from "react-dropzone";

interface Message extends ChatMessage {
  rating?: number;
  isBookmarked?: boolean;
}

interface FloatingButton {
  label: string;
  icon: any;
  action: () => void;
}

export default function AdvancedChat() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Hidden by default on mobile
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);
  const [showSideNotes, setShowSideNotes] = useState(false);
  const [sideNotes, setSideNotes] = useState("");
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [highlightedText, setHighlightedText] = useState<string>("");
  const [aiMode, setAiMode] = useState<"chat" | "writing" | "coding" | "image">("chat");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; analysis: string }[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load chat sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ["/api/chat/sessions"],
    enabled: !!user,
  });

  // Load current session messages
  const { data: sessionMessages = [] } = useQuery({
    queryKey: ["/api/chat/messages", currentSessionId],
    enabled: !!currentSessionId && !!user,
  });

  useEffect(() => {
    setMessages(sessionMessages as Message[]);
  }, [sessionMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/chat/send", { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      setMessage("");
      toast({ title: "Message sent" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        setLocation("/");
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest("POST", "/api/chat/sessions", { title, mode: aiMode });
      return response.json();
    },
    onSuccess: (session: ChatSession) => {
      setCurrentSessionId(session.id);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      toast({ title: "New chat created" });
    },
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest("PATCH", `/api/chat/sessions/${currentSessionId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest("DELETE", `/api/chat/sessions/${sessionId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      setCurrentSessionId(null);
      toast({ title: "Chat deleted" });
    },
  });

  // File upload handler
  const onDrop = async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/chat/analyze-file", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        setUploadedFiles((prev) => [...prev, { name: file.name, analysis: data.analysis }]);
        toast({ title: "File analyzed", description: file.name });
      } catch (error) {
        toast({ title: "Upload failed", variant: "destructive" });
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  // Send message handler
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    if (!currentSessionId) {
      await createSessionMutation.mutateAsync("New Chat");
    }

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      userId: user?.id || "",
      role: "user",
      content: message,
      createdAt: new Date(),
      attachments: null,
    };
    setMessages((prev) => [...prev, newMsg]);

    await sendMessageMutation.mutateAsync(message);
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", audioBlob, "voice.webm");

        try {
          const response = await fetch("/api/transcribe", { method: "POST", body: formData });
          const data = await response.json();
          setMessage(data.text);
        } catch (error) {
          toast({ title: "Transcription failed", variant: "destructive" });
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({ title: "Recording started" });
    } catch (error) {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  };

  // TTS
  const speakMessage = (text: string, id: string) => {
    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    } else {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
      setSpeakingMessageId(id);
    }
  };

  // Floating suggestion buttons
  const floatingActions: FloatingButton[] = [
    {
      label: "Summarize",
      icon: BookOpen,
      action: () => setMessage((prev) => prev + "\n\n[Request: Summarize this]"),
    },
    {
      label: "Make shorter",
      icon: Zap,
      action: () => setMessage((prev) => prev + "\n\n[Request: Make this shorter]"),
    },
    {
      label: "Make actionable",
      icon: MessageSquare,
      action: () => setMessage((prev) => prev + "\n\n[Request: Make this actionable]"),
    },
    {
      label: "Explain like I'm 10",
      icon: MessageCircle,
      action: () => setMessage((prev) => prev + "\n\n[Request: Explain like I'm 10]"),
    },
    {
      label: "Create tasks",
      icon: Flag,
      action: () => setMessage((prev) => prev + "\n\n[Request: Create tasks from this]"),
    },
  ];

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar - Mobile overlay, desktop fixed */}
      <div className={`fixed md:relative top-0 left-0 h-full md:h-auto z-50 md:z-auto ${isSidebarOpen ? "w-64" : "w-0"} transition-all duration-300 border-r border-border bg-muted/30 flex flex-col overflow-hidden`}>
        {isSidebarOpen && (
          <>
            {/* New Chat Button */}
            <Button
              onClick={() => createSessionMutation.mutate("New Chat")}
              className="m-4 hover-elevate"
              data-testid="button-new-chat"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-4 space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground mb-3">CHAT HISTORY</h3>
              {(sessions as ChatSession[]).map((session: ChatSession) => (
                <div
                  key={session.id}
                  className={`p-2 rounded-lg cursor-pointer hover-elevate transition-all group ${
                    currentSessionId === session.id ? "bg-primary/10 border border-primary" : "border border-transparent"
                  }`}
                  onClick={() => setCurrentSessionId(session.id)}
                  data-testid={`button-session-${session.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{session.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{session.summary || "No summary"}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedMenuId(expandedMenuId === session.id ? null : session.id);
                      }}
                      data-testid={`button-menu-${session.id}`}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Dropdown Menu */}
                  {expandedMenuId === session.id && (
                    <div className="mt-2 space-y-1 border-t border-border pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full justify-start text-xs hover-elevate"
                        onClick={() => {
                          const newTitle = prompt("Rename chat:", session.title);
                          if (newTitle) updateSessionMutation.mutate({ title: newTitle });
                        }}
                        data-testid={`button-rename-${session.id}`}
                      >
                        Rename
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full justify-start text-xs hover-elevate"
                        onClick={() => updateSessionMutation.mutate({ isBookmarked: !session.isBookmarked })}
                        data-testid={`button-bookmark-${session.id}`}
                      >
                        {session.isBookmarked ? "Unbookmark" : "Bookmark"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full justify-start text-xs text-destructive hover-elevate"
                        onClick={() => deleteSessionMutation.mutate(session.id)}
                        data-testid={`button-delete-${session.id}`}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* User Profile */}
            <Button
              asChild
              variant="ghost"
              className="m-4 w-auto justify-start hover-elevate"
              data-testid="button-user-profile"
            >
              <Link href="/settings">
                <User className="h-4 w-4 mr-2" />
                {user.firstName || "Profile"}
              </Link>
            </Button>
          </>
        )}
      </div>

      {/* Mobile overlay backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          data-testid="overlay-sidebar"
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-lg bg-background/80 p-2 md:p-4 flex items-center justify-between sticky top-0 z-40 gap-1 md:gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            data-testid="button-toggle-sidebar"
            className="shrink-0"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <h1 className="font-display font-semibold text-sm md:text-lg truncate flex-1">
            {currentSessionId ? (sessions as ChatSession[]).find((s: ChatSession) => s.id === currentSessionId)?.title : "New Chat"}
          </h1>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => setShowSideNotes(!showSideNotes)} data-testid="button-side-notes" className="hidden md:inline-flex">
              <MessageSquare className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 flex flex-col w-full">
            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <Bot className="h-16 w-16 mx-auto mb-4 text-primary opacity-50" />
                    <h2 className="text-2xl font-display font-semibold mb-2">Start a Conversation</h2>
                    <p className="text-muted-foreground">Ask me anything. I can teach, write, code, and more.</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <Card
                    key={msg.id || idx}
                    className={`p-3 md:p-4 hover-elevate ${msg.role === "user" ? "ml-4 md:ml-12" : "mr-4 md:mr-12"} cursor-pointer`}
                    onClick={() => {
                      setSelectedMessages((prev) => {
                        const newSet = new Set(prev);
                        newSet.has(msg.id) ? newSet.delete(msg.id) : newSet.add(msg.id);
                        return newSet;
                      });
                    }}
                    data-testid={`message-${msg.id || idx}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-primary/20" : "bg-secondary/20"}`}>
                        {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{msg.content}</p>
                        {msg.role === "assistant" && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => speakMessage(msg.content, msg.id)} data-testid={`button-speak-${msg.id}`}>
                              <Volume2 className="h-3 w-3 mr-1" />
                              {speakingMessageId === msg.id ? "Stop" : "Speak"}
                            </Button>
                            <Button size="sm" variant="outline" data-testid={`button-copy-${msg.id}`}>
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                            <Button size="sm" variant="outline" data-testid={`button-regenerate-${msg.id}`}>
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Regenerate
                            </Button>
                            <Button size="sm" variant="outline" data-testid={`button-continue-${msg.id}`}>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              Continue
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Floating suggestion buttons - after last message (hidden on mobile) */}
            {messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
              <div className="px-3 md:px-6 pb-4 hidden md:flex flex-wrap gap-2">
                {floatingActions.map((action, idx) => (
                  <Button
                    key={idx}
                    size="sm"
                    variant="outline"
                    onClick={action.action}
                    className="hover-elevate"
                    data-testid={`button-action-${action.label}`}
                  >
                    <action.icon className="h-3 w-3 mr-1" />
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            {/* AI Mode Selector */}
            <div className="px-3 md:px-6 pb-4 flex gap-1 md:gap-2 overflow-x-auto">
              {(["chat", "writing", "coding", "image"] as const).map((mode) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={aiMode === mode ? "default" : "outline"}
                  onClick={() => setAiMode(mode)}
                  className="hover-elevate capitalize whitespace-nowrap"
                  data-testid={`button-mode-${mode}`}
                >
                  {mode}
                </Button>
              ))}
            </div>

            {/* Input Area */}
            <div className={`border-t border-border p-2 md:p-4 space-y-2 md:space-y-3 ${isDragActive ? "bg-primary/5" : ""}`} {...getRootProps()}>
              <input {...getInputProps()} />

              {uploadedFiles.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uploadedFiles.map((file, idx) => (
                    <Card key={idx} className="p-2 text-xs">
                      <p className="font-semibold truncate">{file.name}</p>
                      <p className="text-muted-foreground line-clamp-2">{file.analysis.slice(0, 80)}...</p>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex gap-1 md:gap-2">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Message..."
                  className="resize-none flex-1 min-h-10 max-h-24 text-sm"
                  data-testid="input-message"
                />
                <div className="flex flex-col gap-1">
                  <Button
                    size="icon"
                    onClick={() => {
                      if (isRecording) stopRecording();
                      else startRecording();
                    }}
                    variant={isRecording ? "destructive" : "default"}
                    className="hover-elevate h-10 w-10"
                    data-testid="button-record"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" className="hover-elevate h-10 w-10 hidden sm:inline-flex" data-testid="button-upload">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={sendMessageMutation.isPending}
                    className="hover-elevate h-10 w-10"
                    data-testid="button-send"
                  >
                    {sendMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Side Notes Panel - Desktop only */}
          {showSideNotes && (
            <div className="hidden md:flex w-64 border-l border-border p-4 flex-col bg-muted/20">
              <h3 className="font-semibold mb-3 text-sm">Notes</h3>
              <Textarea value={sideNotes} onChange={(e) => setSideNotes(e.target.value)} placeholder="Add notes..." className="flex-1 resize-none text-sm" data-testid="textarea-notes" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
