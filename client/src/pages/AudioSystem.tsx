import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "wouter";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Play,
  Pause,
  Download,
  Trash2,
  Settings,
  Volume2,
  Languages,
  Clock,
  Loader2,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AudioSystem() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [currentTab, setCurrentTab] = useState("record");

  const { data: audioSessions = [] } = useQuery<any[]>({
    queryKey: ["/api/audio-sessions"],
    enabled: !!user,
  });

  const recordAudioMutation = useMutation({
    mutationFn: async (duration: number) => {
      const response = await apiRequest("POST", "/api/audio/start-session", {
        duration,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Recording started", description: "Recording audio..." });
      queryClient.invalidateQueries({ queryKey: ["/api/audio-sessions"] });
    },
  });

  const transcribeAudioMutation = useMutation({
    mutationFn: async (audioId: string) => {
      const response = await apiRequest("POST", "/api/audio/transcribe", {
        audioId,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Audio transcribed" });
      queryClient.invalidateQueries({ queryKey: ["/api/audio-sessions"] });
    },
  });

  if (authLoading || !user) {
    return <div>Loading...</div>;
  }

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
                <Mic className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Audio System</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="record" onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3" data-testid="tabs-audio">
            <TabsTrigger value="record" data-testid="tab-record">
              <Mic className="h-4 w-4 mr-2" />
              Record
            </TabsTrigger>
            <TabsTrigger value="sessions" data-testid="tab-sessions">
              <Clock className="h-4 w-4 mr-2" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Record Tab */}
          <TabsContent value="record" className="space-y-6 mt-6">
            <Card className="hover-elevate" data-testid="card-recorder">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" />
                  Live Recording
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Recording Visualizer */}
                <div className="bg-secondary/50 rounded-lg p-8 text-center">
                  <div className="flex justify-center gap-1 mb-6 h-16">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 bg-primary rounded-full ${
                          isRecording ? "animate-pulse" : ""
                        }`}
                        style={{
                          height: isRecording ? `${Math.random() * 100}%` : "20%",
                          animationDelay: `${i * 50}ms`,
                        }}
                      ></div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {isRecording ? "Recording in progress..." : "Ready to record"}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {isRecording ? "00:32" : "00:00"}
                  </p>
                </div>

                {/* Record Button */}
                <div className="flex gap-4">
                  <Button
                    size="lg"
                    className={`flex-1 hover-elevate ${
                      isRecording ? "bg-red-500 hover:bg-red-600" : ""
                    }`}
                    onClick={() => setIsRecording(!isRecording)}
                    data-testid="button-toggle-recording"
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="h-5 w-5 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-5 w-5 mr-2" />
                        Start Recording
                      </>
                    )}
                  </Button>
                </div>

                {/* Transcription Options */}
                <div className="space-y-3 pt-6 border-t border-border/50">
                  <h3 className="font-semibold">After Recording</h3>
                  <Button variant="outline" className="w-full hover-elevate" data-testid="button-auto-transcribe">
                    <Volume2 className="h-4 w-4 mr-2" />
                    Auto-Transcribe (Whisper AI)
                  </Button>
                  <Button variant="outline" className="w-full hover-elevate" data-testid="button-translate">
                    <Languages className="h-4 w-4 mr-2" />
                    Translate to English
                  </Button>
                  <Button variant="outline" className="w-full hover-elevate" data-testid="button-summarize">
                    <Clock className="h-4 w-4 mr-2" />
                    Generate Summary
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recording Settings */}
            <Card className="hover-elevate" data-testid="card-recording-settings">
              <CardHeader>
                <CardTitle>Recording Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-semibold block mb-2">Audio Quality</label>
                  <div className="flex gap-2">
                    {["Low", "Medium", "High"].map((quality) => (
                      <Button
                        key={quality}
                        variant="outline"
                        size="sm"
                        className="flex-1 hover-elevate"
                        data-testid={`button-quality-${quality.toLowerCase()}`}
                      >
                        {quality}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-2">Input Device</label>
                  <select className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm" data-testid="select-input-device">
                    <option>Microphone (Default)</option>
                    <option>USB Microphone</option>
                    <option>Headset</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6 mt-6">
            <Card className="hover-elevate" data-testid="card-audio-sessions">
              <CardHeader>
                <CardTitle>Audio Sessions</CardTitle>
              </CardHeader>

              <CardContent>
                {audioSessions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No audio sessions yet. Start recording to create one!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {audioSessions.map((session: any) => (
                      <div key={session.id} className="p-4 bg-secondary/50 rounded-lg hover-elevate" data-testid={`item-session-${session.id}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold">{session.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {session.duration} • {session.date}
                            </p>
                          </div>
                          <Badge>{session.status}</Badge>
                        </div>

                        {session.transcript && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {session.transcript}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 hover-elevate" data-testid={`button-play-${session.id}`}>
                            <Play className="h-4 w-4 mr-1" />
                            Play
                          </Button>
                          <Button size="sm" variant="outline" className="hover-elevate" data-testid={`button-download-${session.id}`}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="hover-elevate"
                            data-testid={`button-delete-${session.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card className="hover-elevate" data-testid="card-audio-settings">
              <CardHeader>
                <CardTitle>Audio Settings</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-semibold block mb-2">
                    Auto-Transcribe on Recording End
                  </label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="hover-elevate" data-testid="button-auto-transcribe-on">
                      On
                    </Button>
                    <Button variant="outline" size="sm" className="hover-elevate" data-testid="button-auto-transcribe-off">
                      Off
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-2">
                    Default Language
                  </label>
                  <select className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm" data-testid="select-language">
                    <option>English</option>
                    <option>Yoruba</option>
                    <option>Pidgin</option>
                    <option>Igbo</option>
                    <option>Hausa</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-2">
                    Storage Limit
                  </label>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full w-7/10"></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    7 GB / 10 GB used
                  </p>
                </div>

                <Button className="w-full hover-elevate" data-testid="button-upgrade-storage">
                  Upgrade Storage
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
