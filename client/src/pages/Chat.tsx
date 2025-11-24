import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Mic,
  Send,
  Paperclip,
  Volume2,
  Loader2,
  Bot,
  User,
  ArrowLeft,
  RotateCcw,
  Image,
  BookOpen,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Menu,
  X,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ChatMessage, ChatSession } from "@shared/schema";
import { useDropzone } from "react-dropzone";

export default function Chat() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showTopicExplainer, setShowTopicExplainer] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [topicSubject, setTopicSubject] = useState("");
  const [topicName, setTopicName] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [explainedTopic, setExplainedTopic] = useState<any>(null);
  const [generatedImagesList, setGeneratedImagesList] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load chat sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<ChatSession[]>({
    queryKey: ["/api/chat/sessions"],
    enabled: !!user,
  });

  // Set first session as current if none selected
  useEffect(() => {
    if (!currentSessionId && sessions.length > 0) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions, currentSessionId]);

  // Load messages for current session
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/messages?sessionId=${currentSessionId}`, currentSessionId],
    enabled: !!user && !!currentSessionId,
  });

  // Create new session
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const chatNumber = sessions.length + 1;
      const response = await apiRequest("POST", "/api/chat/sessions", { 
        title: `Chat ${chatNumber}`,
        mode: "chat"
      });
      return response.json();
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      setCurrentSessionId(newSession.id);
      setMessage("");
      setExplainedTopic(null);
      setGeneratedImagesList([]);
      toast({ title: "New chat created" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create new chat", variant: "destructive" });
    },
  });

  // Delete session
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await apiRequest("DELETE", `/api/chat/sessions/${sessionId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      toast({ title: "Chat deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete chat", variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/chat/send", { content, sessionId: currentSessionId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/messages?sessionId=${currentSessionId}`, currentSessionId] });
      setMessage("");
      toast({
        title: "Message sent",
        description: "Your message was sent successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Send message error:", error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const explainTopicMutation = useMutation({
    mutationFn: async (data: { subject: string; topic: string }) => {
      const response = await apiRequest("POST", "/api/explain-topic", data);
      return response.json();
    },
    onSuccess: (data) => {
      setExplainedTopic(data);
      toast({ title: "Topic explained!", description: "See the explanation below." });
      setShowTopicExplainer(false);
      setTopicSubject("");
      setTopicName("");
      queryClient.invalidateQueries({ queryKey: ["/api/learning-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to explain topic", variant: "destructive" });
    },
  });

  const generateImageMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/generate-image", { prompt });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedImagesList(prev => [...prev, data]);
      toast({ title: "Image generated!", description: "See the image below." });
      setShowImageGenerator(false);
      setImagePrompt("");
      queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate image", variant: "destructive" });
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      toast({
        title: "Files received",
        description: `${acceptedFiles.length} file(s) will be processed`,
      });
    },
    noClick: true,
    noKeyboard: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, authLoading, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speakMessage = (content: string, messageId: string, lang: string = "en-US") => {
    if (speakingMessageId === messageId) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMessageId(messageId);
    setIsPaused(false);

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = lang;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setSpeakingMessageId(null);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSend = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event: BlobEvent) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstart = () => {
          setIsRecording(true);
          toast({
            title: "Recording...",
            description: "Speak now. Click the mic again to stop.",
          });
        };

        mediaRecorder.onstop = async () => {
          setIsRecording(false);
          setIsTranscribing(true);
          
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioDataUrl = await blobToDataUrl(audioBlob);

          try {
            const response = await apiRequest("POST", "/api/chat/transcribe-voice", { audioDataUrl });

            if (response.ok) {
              const { text } = await response.json() as { text: string };
              setMessage((prev) => (prev ? prev + " " + text : text));
              toast({
                title: "Transcribed",
                description: `"${text.slice(0, 50)}${text.length > 50 ? "..." : ""}"`,
              });
            } else {
              toast({
                title: "Transcription failed",
                description: "Could not transcribe your voice. Please try again.",
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error("Transcription error:", error);
            toast({
              title: "Error",
              description: "Failed to transcribe voice input",
              variant: "destructive",
            });
          } finally {
            setIsTranscribing(false);
          }

          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
      } catch (error) {
        console.error("Microphone error:", error);
        toast({
          title: "Microphone error",
          description: "Could not access your microphone. Please check permissions.",
          variant: "destructive",
        });
      }
    } else if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 border-r border-border/50 flex flex-col bg-muted/30 overflow-hidden`}
      >
        <div className="p-4 border-b border-border/50 space-y-3">
          <Button
            onClick={() => createSessionMutation.mutate()}
            disabled={createSessionMutation.isPending}
            className="w-full"
            data-testid="button-new-chat"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Ask LEARNORY
          </Button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessionsLoading ? (
            <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No chats yet</p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-center gap-1 p-2 rounded cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? "bg-primary/20 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <button
                  onClick={() => setCurrentSessionId(session.id)}
                  className="flex-1 text-left text-xs sm:text-sm truncate hover-elevate active-elevate-2 p-1 min-w-0"
                  title={session.title}
                  data-testid={`button-session-${session.id}`}
                >
                  {session.title}
                </button>
                <button
                  onClick={() => deleteSessionMutation.mutate(session.id)}
                  className="opacity-0 hover:opacity-100 transition-opacity p-1 shrink-0"
                  data-testid={`button-delete-session-${session.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-lg bg-background/80">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hover-elevate active-elevate-2"
              >
                {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div>
                <h1 className="font-display font-semibold text-lg">AI Tutor</h1>
                <p className="text-xs text-muted-foreground">Powered by GPT-3.5 + OpenRouter</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="hover-elevate active-elevate-2" data-testid="link-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div
          {...getRootProps()}
          className="flex-1 overflow-y-auto max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6"
        >
          <input {...getInputProps()} />
          {isDragActive && (
            <div className="fixed inset-0 bg-primary/10 border-4 border-dashed border-primary flex items-center justify-center z-50">
              <div className="bg-background rounded-lg p-8 text-center">
                <Paperclip className="h-12 w-12 mx-auto mb-4 text-primary" />
                <p className="text-lg font-semibold">Drop files here to upload</p>
              </div>
            </div>
          )}

          {messagesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-display font-semibold mb-2">
                Hello, I'm your AI Tutor!
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Ask me anything about your studies. I can help with explanations,
                problem-solving, and answering questions across all subjects.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                <Button
                  variant="outline"
                  className="justify-start hover-elevate active-elevate-2 h-auto py-4 px-4"
                  onClick={() => setMessage("Explain photosynthesis in simple terms")}
                  data-testid="button-suggestion-1"
                >
                  <div className="text-left">
                    <div className="font-semibold text-sm mb-1">Explain photosynthesis</div>
                    <div className="text-xs text-muted-foreground">In simple terms</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start hover-elevate active-elevate-2 h-auto py-4 px-4"
                  onClick={() => setMessage("Help me solve: 2x + 5 = 15")}
                  data-testid="button-suggestion-2"
                >
                  <div className="text-left">
                    <div className="font-semibold text-sm mb-1">Solve an equation</div>
                    <div className="text-xs text-muted-foreground">Step by step</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start hover-elevate active-elevate-2 h-auto py-4 px-4"
                  onClick={() => setMessage("What are the causes of the First World War?")}
                  data-testid="button-suggestion-3"
                >
                  <div className="text-left">
                    <div className="font-semibold text-sm mb-1">History question</div>
                    <div className="text-xs text-muted-foreground">WWI causes</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start hover-elevate active-elevate-2 h-auto py-4 px-4"
                  onClick={() => setMessage("Teach me about Newton's laws of motion")}
                  data-testid="button-suggestion-4"
                >
                  <div className="text-left">
                    <div className="font-semibold text-sm mb-1">Physics concepts</div>
                    <div className="text-xs text-muted-foreground">Newton's laws</div>
                  </div>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 w-full flex flex-col">
              {/* Explained Topic Display */}
              {explainedTopic && (
                <Card className="p-6 border-primary/30 bg-primary/5">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold mb-2">
                        {explainedTopic.subject} - {explainedTopic.topic}
                      </h2>
                      
                      {explainedTopic.imageUrl && (
                        <div className="mb-4 rounded-lg overflow-hidden border border-border/50">
                          <img 
                            src={explainedTopic.imageUrl} 
                            alt={explainedTopic.topic}
                            className="w-full h-auto max-h-[300px] object-cover"
                            data-testid="img-topic-explanation"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-sm mb-1">Simple Explanation</h3>
                        <p className="text-sm text-muted-foreground">{explainedTopic.simpleExplanation}</p>
                      </div>

                      {explainedTopic.examples && explainedTopic.examples.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-sm mb-1">Examples</h3>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {explainedTopic.examples.map((ex: string, i: number) => (
                              <li key={i}>• {ex}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {explainedTopic.formulas && explainedTopic.formulas.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-sm mb-1">Formulas</h3>
                          <div className="text-sm text-muted-foreground space-y-1 bg-muted/30 p-2 rounded">
                            {explainedTopic.formulas.map((formula: string, i: number) => (
                              <div key={i}>{formula}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {explainedTopic.realLifeApplications && explainedTopic.realLifeApplications.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-sm mb-1">Real-Life Applications</h3>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {explainedTopic.realLifeApplications.map((app: string, i: number) => (
                              <li key={i}>• {app}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {explainedTopic.commonMistakes && explainedTopic.commonMistakes.length > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded p-2">
                          <h3 className="font-semibold text-sm mb-1 text-amber-700">Common Mistakes</h3>
                          <ul className="text-sm text-amber-600 space-y-1">
                            {explainedTopic.commonMistakes.map((mistake: string, i: number) => (
                              <li key={i}>• {mistake}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {explainedTopic.practiceQuestions && explainedTopic.practiceQuestions.length > 0 && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
                          <h3 className="font-semibold text-sm mb-1 text-blue-700">Practice Questions</h3>
                          <ul className="text-sm text-blue-600 space-y-1">
                            {explainedTopic.practiceQuestions.map((q: string, i: number) => (
                              <li key={i}>• {q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setExplainedTopic(null)}
                      className="w-full hover-elevate active-elevate-2"
                    >
                      Clear Explanation
                    </Button>
                  </div>
                </Card>
              )}

              {/* Generated Images Display */}
              {generatedImagesList.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Generated Images ({generatedImagesList.length})</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {generatedImagesList.map((img, idx) => (
                      <Card key={idx} className="p-3 overflow-hidden">
                        <img 
                          src={img.imageUrl} 
                          alt={img.prompt}
                          className="w-full h-auto rounded mb-2"
                          data-testid={`img-generated-${idx}`}
                        />
                        <p className="text-xs text-muted-foreground truncate" title={img.prompt}>
                          {img.prompt}
                        </p>
                      </Card>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setGeneratedImagesList([])}
                    className="w-full hover-elevate active-elevate-2"
                  >
                    Clear Images
                  </Button>
                </div>
              )}

              {messages.map((msg) => {
                const stickerMatch = msg.role === "assistant" ? msg.content.match(/^([🎓🧮🔬📚💡🎯🎉😊🧠💻🌍🎨❓✅\s]+)\n/) : null;
                const sticker = stickerMatch ? stickerMatch[1].trim() : null;
                const messageContent = stickerMatch ? msg.content.replace(/^[🎓🧮🔬📚💡🎯🎉😊🧠💻🌍🎨❓✅\s]+\n/, "") : msg.content;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                    data-testid={`message-${msg.role}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="max-w-[80%]">
                      {sticker && (
                        <div className="text-3xl mb-2">
                          {sticker}
                        </div>
                      )}
                      <Card
                        className={`p-4 cursor-pointer transition-opacity ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card hover:opacity-80"
                        } ${speakingMessageId === msg.id ? "ring-2 ring-primary" : ""}`}
                        onClick={() => {
                          if (msg.role === "assistant") {
                            speakMessage(messageContent, msg.id, "en-US");
                          }
                        }}
                        data-testid={`card-message-${msg.id}`}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm">{messageContent}</p>
                      </Card>
                    </div>
                    {msg.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border/50 bg-background/80 backdrop-blur-lg">
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 space-y-4">
            {/* Topic Explainer Modal */}
            {showTopicExplainer && (
              <Card className="p-4 border-primary/30 bg-primary/5">
                <h3 className="font-semibold mb-3">Explain a Topic</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Subject (e.g., Biology)"
                    value={topicSubject}
                    onChange={(e) => setTopicSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                    data-testid="input-topic-subject"
                  />
                  <input
                    type="text"
                    placeholder="Topic (e.g., Photosynthesis)"
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                    data-testid="input-topic-name"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => explainTopicMutation.mutate({ subject: topicSubject, topic: topicName })}
                      disabled={!topicSubject.trim() || !topicName.trim() || explainTopicMutation.isPending}
                      size="sm"
                      className="hover-elevate active-elevate-2"
                      data-testid="button-submit-topic"
                    >
                      {explainTopicMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Explain"}
                    </Button>
                    <Button
                      onClick={() => setShowTopicExplainer(false)}
                      variant="outline"
                      size="sm"
                      className="hover-elevate active-elevate-2"
                      data-testid="button-close-topic"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Image Generator Modal */}
            {showImageGenerator && (
              <Card className="p-4 border-primary/30 bg-primary/5">
                <h3 className="font-semibold mb-3">Generate Image</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Describe the image you want..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                    data-testid="input-image-prompt"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => generateImageMutation.mutate(imagePrompt)}
                      disabled={!imagePrompt.trim() || generateImageMutation.isPending}
                      size="sm"
                      className="hover-elevate active-elevate-2"
                      data-testid="button-generate"
                    >
                      {generateImageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
                    </Button>
                    <Button
                      onClick={() => setShowImageGenerator(false)}
                      variant="outline"
                      size="sm"
                      className="hover-elevate active-elevate-2"
                      data-testid="button-close-image"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex gap-3">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="resize-none"
                data-testid="input-message"
              />
              <div className="flex gap-2 flex-col">
                <Button
                  onClick={toggleVoice}
                  disabled={isTranscribing}
                  size="icon"
                  variant={isRecording ? "destructive" : "outline"}
                  className="hover-elevate active-elevate-2"
                  data-testid="button-voice-record"
                  title={isRecording ? "Stop recording" : "Start recording"}
                >
                  <Mic className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="hover-elevate active-elevate-2"
                  data-testid="button-file-upload"
                  title="Upload file"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Button
                  onClick={() => setShowImageGenerator(!showImageGenerator)}
                  size="icon"
                  variant={showImageGenerator ? "default" : "outline"}
                  className="hover-elevate active-elevate-2"
                  data-testid="button-generate-image"
                  title="Generate image"
                >
                  <Image className="h-5 w-5" />
                </Button>
                <Button
                  onClick={() => setShowTopicExplainer(!showTopicExplainer)}
                  size="icon"
                  variant={showTopicExplainer ? "default" : "outline"}
                  className="hover-elevate active-elevate-2"
                  data-testid="button-explain-topic"
                  title="Explain topic"
                >
                  <BookOpen className="h-5 w-5" />
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  size="icon"
                  className="hover-elevate active-elevate-2"
                  data-testid="button-send-message"
                  title="Send message"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <input
                id="file-input"
                type="file"
                style={{ display: "none" }}
                onChange={(e) => {
                  const files = e.currentTarget.files;
                  if (files && files.length > 0) {
                    toast({
                      title: "File received",
                      description: `File ${files[0].name} will be processed`,
                    });
                  }
                }}
                data-testid="input-file-upload"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
