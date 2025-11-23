import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Mic,
  Square,
  Pause,
  Play,
  Save,
  Settings,
  Users,
  Clock,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

interface TranscriptSegment {
  speaker: string;
  text: string;
  timestamp: number;
}

export default function LiveSession() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    if (!sessionTitle.trim()) {
      toast({
        title: "Session title required",
        description: "Please enter a title for this session",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create live session via API
      const res = await apiRequest("POST", "/api/live-sessions", { title: sessionTitle });
      const sessionData = await res.json();
      setSessionId(sessionData.id);

      // Initialize WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'transcript_segment') {
            setTranscript((prev) => [
              ...prev,
              {
                speaker: data.data.speaker || user?.firstName || "Speaker",
                text: data.data.text,
                timestamp: data.data.timestamp,
              },
            ]);
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast({
          title: "Connection error",
          description: "Failed to connect to transcription service",
          variant: "destructive",
        });
      };

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          // Convert blob to base64 and send via WebSocket
          const reader = new FileReader();
          reader.onload = () => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'audio_chunk',
                data: reader.result, // Base64 encoded
              }));
            }
          };
          reader.readAsDataURL(event.data);
        }
      };

      mediaRecorder.start(1000); // Capture audio in 1-second chunks

      setIsRecording(true);
      setDuration(0);
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    toast({
      title: isPaused ? "Recording resumed" : "Recording paused",
    });
  };

  const stopRecording = async () => {
    // Stop media recorder
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Save transcript to backend
    if (sessionId && transcript.length > 0) {
      try {
        await apiRequest("POST", "/api/transcripts", {
          sessionId,
          segments: transcript,
          audioUrl: null, // Would be uploaded audio URL in real implementation
        });

        // Update session status
        await apiRequest("PATCH", `/api/live-sessions/${sessionId}`, { status: 'completed' });
      } catch (error) {
        console.error("Error saving transcript:", error);
      }
    }

    setIsRecording(false);
    setIsPaused(false);
    toast({
      title: "Recording stopped",
      description: "Your session has been saved",
    });
  };

  const saveAsLesson = async () => {
    setIsProcessing(true);
    toast({
      title: "Generating lesson",
      description: "AI is converting your transcript into a structured lesson...",
    });

    try {
      const transcriptText = transcript.map(seg => `${seg.speaker}: ${seg.text}`).join('\n');
      await apiRequest("POST", "/api/lessons/generate", {
        transcriptText,
        courseId: null, // Could be linked to a course
      });

      setIsProcessing(false);
      toast({
        title: "Lesson created!",
        description: "Your lesson has been saved successfully",
      });
    } catch (error) {
      console.error("Error generating lesson:", error);
      setIsProcessing(false);
      toast({
        title: "Error",
        description: "Failed to generate lesson",
        variant: "destructive",
      });
    }
  };

  const jumpToTimestamp = (timestamp: number) => {
    toast({
      title: "Timestamp",
      description: new Date(timestamp).toLocaleTimeString(),
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild className="hover-elevate active-elevate-2">
                <Link href="/dashboard">
                  <a data-testid="link-back">
                    <ArrowLeft className="h-5 w-5" />
                  </a>
                </Link>
              </Button>
              <div>
                <h1 className="font-display font-semibold text-lg">Live Session</h1>
                {isRecording && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    Recording
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        {/* Transcript Pane (70%) */}
        <div className="flex-1 lg:w-[70%] overflow-y-auto p-4 sm:p-6">
          {transcript.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <Mic className="h-16 w-16 mx-auto mb-4 text-primary opacity-50" />
                <h2 className="text-2xl font-display font-semibold mb-2">
                  Start Your Live Session
                </h2>
                <p className="text-muted-foreground mb-6">
                  Enter a title and click record to begin. Your voice will be
                  transcribed in real-time with AI.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-semibold">{sessionTitle}</h2>
                <Button
                  onClick={saveAsLesson}
                  disabled={isProcessing}
                  className="hover-elevate active-elevate-2"
                  data-testid="button-save-lesson"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save as Lesson
                    </>
                  )}
                </Button>
              </div>

              {transcript.map((segment, index) => (
                <Card
                  key={index}
                  className="p-4 hover-elevate cursor-pointer"
                  onClick={() => jumpToTimestamp(segment.timestamp)}
                  data-testid={`transcript-segment-${index}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {segment.speaker.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{segment.speaker}</span>
                        <Badge variant="outline" className="text-xs">
                          {new Date(segment.timestamp).toLocaleTimeString()}
                        </Badge>
                      </div>
                      <p className="text-sm">{segment.text}</p>
                    </div>
                  </div>
                </Card>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          )}
        </div>

        {/* Controls Panel (30%) */}
        <div className="lg:w-[30%] border-l border-border p-4 sm:p-6 bg-muted/30 flex flex-col">
          <div className="space-y-6 flex-1">
            {/* Session Title */}
            {!isRecording && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Session Title
                </label>
                <Input
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g., Introduction to Physics"
                  data-testid="input-session-title"
                />
              </div>
            )}

            {/* Timer */}
            {isRecording && (
              <Card className="p-4 bg-background">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Duration</span>
                </div>
                <div className="text-3xl font-display font-bold text-center text-primary">
                  {formatDuration(duration)}
                </div>
              </Card>
            )}

            {/* Recording Controls */}
            <div className="space-y-3">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="w-full h-14 text-lg hover-elevate active-elevate-2"
                  data-testid="button-start-recording"
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Button
                      onClick={togglePause}
                      variant="outline"
                      className="flex-1 hover-elevate active-elevate-2"
                      data-testid="button-pause"
                    >
                      {isPaused ? (
                        <>
                          <Play className="h-5 w-5 mr-2" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="h-5 w-5 mr-2" />
                          Pause
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={stopRecording}
                      variant="destructive"
                      className="flex-1 hover-elevate active-elevate-2"
                      data-testid="button-stop"
                    >
                      <Square className="h-5 w-5 mr-2" />
                      Stop
                    </Button>
                  </div>

                  {/* Waveform Visualization */}
                  <Card className="p-4 bg-background">
                    <div className="flex items-center justify-center gap-1 h-20">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-primary rounded-full animate-pulse"
                          style={{
                            height: `${Math.random() * 60 + 20}%`,
                            animationDelay: `${i * 0.05}s`,
                          }}
                        />
                      ))}
                    </div>
                  </Card>
                </>
              )}
            </div>

            {/* Session Info */}
            <Card className="p-4 bg-background">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Participants</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span className="font-semibold">1</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Segments</span>
                  <span className="font-semibold">{transcript.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Language</span>
                  <Badge variant="outline">English</Badge>
                </div>
              </div>
            </Card>

            {/* Settings */}
            <Button
              variant="outline"
              className="w-full hover-elevate active-elevate-2"
              data-testid="button-settings"
            >
              <Settings className="h-4 w-4 mr-2" />
              Session Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
