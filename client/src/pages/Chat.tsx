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
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ChatMessage } from "@shared/schema";
import { useDropzone } from "react-dropzone";

export default function Chat() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    enabled: !!user,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/chat/send", { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      // Handle file upload
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

  const speakMessage = (content: string, messageId: string) => {
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    setSpeakingMessageId(messageId);

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setSpeakingMessageId(null);
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
      // Start recording
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

          // Stop all audio tracks
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
      // Stop recording
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

  const toggleSpeak = () => {
    setIsSpeaking(!isSpeaking);
    toast({
      title: isSpeaking ? "Voice output disabled" : "Voice output enabled",
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-lg bg-background/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="hover-elevate active-elevate-2" data-testid="link-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="font-display font-semibold text-lg">AI Tutor</h1>
                <p className="text-xs text-muted-foreground">Powered by GPT-3.5 + OpenRouter</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
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
            {messages.map((msg) => (
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
                <Card
                  className={`max-w-[80%] p-4 cursor-pointer transition-opacity ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card hover:opacity-80"
                  } ${speakingMessageId === msg.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => {
                    if (msg.role === "assistant") {
                      speakMessage(msg.content, msg.id);
                    }
                  }}
                  data-testid={`card-message-${msg.id}`}
                >
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && (
                    <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      {speakingMessageId === msg.id ? (
                        <>
                          <Volume2 className="h-3 w-3 animate-pulse" />
                          <span>Speaking...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3 w-3" />
                          <span>Tap to listen</span>
                        </>
                      )}
                    </div>
                  )}
                </Card>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-chart-2/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-chart-2" />
                  </div>
                )}
              </div>
            ))}
            {sendMessageMutation.isPending && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <Card className="max-w-[80%] p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 border-t border-border/50 backdrop-blur-lg bg-background/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              size="icon"
              className="hover-elevate active-elevate-2 flex-shrink-0"
              onClick={() => document.getElementById("file-input")?.click()}
              data-testid="button-attach"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="resize-none min-h-[60px] max-h-[200px] pr-12"
                rows={2}
                data-testid="input-message"
              />
              <Button
                variant="ghost"
                size="icon"
                className={`absolute bottom-2 right-2 hover-elevate active-elevate-2 ${
                  isRecording || isTranscribing ? "text-red-500" : ""
                }`}
                onClick={toggleVoice}
                disabled={isTranscribing}
                data-testid="button-voice"
              >
                {isTranscribing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Mic className={`h-5 w-5 ${isRecording ? "animate-pulse" : ""}`} />
                )}
              </Button>
            </div>
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="hover-elevate active-elevate-2 flex-shrink-0"
              data-testid="button-send"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
