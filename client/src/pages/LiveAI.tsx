import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Loader,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type AvatarGender = "female" | "male";

export default function LiveAI() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCallActive, setIsCallActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [avatarGender, setAvatarGender] = useState<AvatarGender>("female");
  const [isConnecting, setIsConnecting] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const vapiRef = useRef<any>(null);
  const callRef = useRef<any>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout>();
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Vapi call
  useEffect(() => {
    const initVapi = async () => {
      try {
        // Dynamic import of Vapi SDK
        const VapiClass = (window as any).Vapi;
        if (!VapiClass) {
          // Load Vapi script
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest";
          script.async = true;
          script.onload = () => {
            initializeVapiCall();
          };
          document.head.appendChild(script);
          return;
        }

        initializeVapiCall();
      } catch (error) {
        console.error("Failed to initialize Vapi:", error);
        toast({
          title: "Connection Error",
          description: "Failed to initialize voice connection",
          variant: "destructive",
        });
      }
    };

    const initializeVapiCall = async () => {
      try {
        // Fetch public key from backend
        const configRes = await fetch("/api/vapi-config");
        if (!configRes.ok) {
          throw new Error("Failed to fetch Vapi configuration");
        }
        const { publicKey } = await configRes.json();

        const vapi = new (window as any).Vapi(publicKey);
        vapiRef.current = vapi;

        // Set up event handlers
        vapi.on("call-start", handleCallStart);
        vapi.on("call-end", handleCallEnd);
        vapi.on("speech-start", handleSpeechStart);
        vapi.on("speech-end", handleSpeechEnd);
        vapi.on("message", handleMessage);
        vapi.on("error", handleError);

        // Start call with assistant configuration
        const assistantConfig = {
          model: {
            provider: "openai",
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `You are LEARNORY ULTRA, an advanced AI tutor. You are a ${avatarGender === "female" ? "professional female" : "professional male"} educational assistant. Respond conversationally and helpfully to educational questions. Keep responses concise and engaging. Avoid lengthy explanations unless specifically asked.`,
              },
            ],
          },
          voice: {
            provider: "openai",
            voiceId: avatarGender === "female" ? "nova" : "onyx",
          },
        };

        // Start the call
        await vapi.start(assistantConfig);
        callRef.current = vapi;

        // Start duration timer
        durationIntervalRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);

        setIsConnecting(false);
      } catch (error) {
        console.error("Failed to start Vapi call:", error);
        toast({
          title: "Connection Failed",
          description: "Could not establish voice connection. Please try again.",
          variant: "destructive",
        });
        setIsCallActive(false);
      }
    };

    initVapi();

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (vapiRef.current) {
        vapiRef.current.removeAllListeners();
      }
    };
  }, []);

  const handleCallStart = useCallback(() => {
    console.log("Call started");
    setIsConnecting(false);
    toast({ title: "Connected", description: "Voice call started" });
  }, [toast]);

  const handleCallEnd = useCallback(() => {
    console.log("Call ended");
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    setIsCallActive(false);
  }, []);

  const handleSpeechStart = useCallback(() => {
    console.log("User started speaking");
  }, []);

  const handleSpeechEnd = useCallback(() => {
    console.log("User stopped speaking");
  }, []);

  const handleMessage = useCallback((message: any) => {
    console.log("Message from Vapi:", message);
  }, []);

  const handleError = useCallback(
    (error: any) => {
      console.error("Vapi error:", error);
      toast({
        title: "Call Error",
        description: error?.message || "An error occurred during the call",
        variant: "destructive",
      });
    },
    [toast]
  );

  const toggleMute = () => {
    if (vapiRef.current) {
      if (isMuted) {
        vapiRef.current.unmute();
      } else {
        vapiRef.current.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  const endCall = async () => {
    if (vapiRef.current) {
      await vapiRef.current.stop();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      setIsCallActive(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isCallActive) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 items-center justify-center">
        <Card className="p-8 bg-slate-800/50 border-purple-500/20 text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Call Ended
          </h1>
          <p className="text-slate-300 mb-2">
            Duration: {formatDuration(callDuration)}
          </p>
          <p className="text-slate-400 mb-6 text-sm">
            Thank you for learning with LEARNORY AI
          </p>
          <Link href="/chat">
            <Button className="w-full">Back to Chat</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-b border-purple-500/20 p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${isConnecting ? "bg-yellow-400 animate-pulse" : "bg-green-400 animate-pulse"}`}
              data-testid="status-indicator"
            />
            <h1 className="text-2xl font-bold text-white">LEARNORY LIVE AI</h1>
            <span className="text-sm text-slate-400">{formatDuration(callDuration)}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2 bg-slate-700/50 rounded-lg p-2">
              <Button
                variant={avatarGender === "female" ? "default" : "ghost"}
                size="sm"
                onClick={() => setAvatarGender("female")}
                data-testid="button-avatar-female"
              >
                Female
              </Button>
              <Button
                variant={avatarGender === "male" ? "default" : "ghost"}
                size="sm"
                onClick={() => setAvatarGender("male")}
                data-testid="button-avatar-male"
              >
                Male
              </Button>
            </div>
            <Link href="/chat">
              <Button variant="outline" size="sm">
                Exit
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {isConnecting ? (
          <div className="text-center">
            <Loader className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Connecting...
            </h2>
            <p className="text-slate-400">Initializing LEARNORY Live AI</p>
          </div>
        ) : (
          <>
            {/* Avatar Display */}
            <Card className="w-full max-w-md h-96 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 backdrop-blur flex items-center justify-center overflow-hidden mb-6">
              <div
                ref={videoContainerRef}
                className="w-full h-full flex items-center justify-center bg-slate-900/50"
                data-testid="avatar-container"
              >
                {/* Vapi will inject video/avatar here */}
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-4 flex items-center justify-center">
                    <div className="text-5xl">
                      {avatarGender === "female" ? "👩" : "👨"}
                    </div>
                  </div>
                  <p className="text-slate-300">
                    {avatarGender === "female"
                      ? "Female Tutor"
                      : "Male Tutor"}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Powered by Vapi Real-time AI
                  </p>
                </div>
              </div>
            </Card>

            {/* Status Text */}
            <p className="text-slate-300 mb-6 text-center max-w-md">
              Speak naturally. LEARNORY AI is listening and will respond in
              real-time with personalized tutoring.
            </p>

            {/* Controls */}
            <div className="flex gap-4 flex-wrap justify-center">
              <Button
                variant={isMuted ? "destructive" : "default"}
                size="lg"
                onClick={toggleMute}
                data-testid="button-mute"
                className="gap-2"
              >
                {isMuted ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    Muted
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    Listening
                  </>
                )}
              </Button>

              <Button
                variant={isSpeakerOn ? "default" : "outline"}
                size="lg"
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                data-testid="button-speaker"
                className="gap-2"
              >
                {isSpeakerOn ? (
                  <>
                    <Volume2 className="w-5 h-5" />
                    Speaker On
                  </>
                ) : (
                  <>
                    <VolumeX className="w-5 h-5" />
                    Speaker Off
                  </>
                )}
              </Button>

              <Button
                variant="destructive"
                size="lg"
                onClick={endCall}
                data-testid="button-end-call"
                className="gap-2"
              >
                <PhoneOff className="w-5 h-5" />
                End Call
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
