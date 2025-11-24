import { useState, useEffect, useRef } from "react";
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
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useVoice } from "@/lib/useVoice";

type AvatarGender = "female" | "male";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function LiveAI() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCallActive, setIsCallActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [avatarGender, setAvatarGender] = useState<AvatarGender>("female");
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const videoRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            handleUserMessage(transcript);
          } else {
            interim += transcript;
          }
        }
        if (interim) setCurrentMessage(interim);
      };
    }
  }, []);

  // Start listening on component mount
  useEffect(() => {
    if (recognitionRef.current && isCallActive && !isMuted) {
      recognitionRef.current.start();
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isCallActive, isMuted]);

  // Animate avatar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawAvatar = (mouthOpen: boolean) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Head
      ctx.fillStyle = avatarGender === "female" ? "#fdbcb4" : "#daa520";
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 - 20, 60, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(canvas.width / 2 - 20, canvas.height / 2 - 40, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(canvas.width / 2 + 20, canvas.height / 2 - 40, 8, 0, Math.PI * 2);
      ctx.fill();

      // Mouth
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (mouthOpen) {
        ctx.ellipse(canvas.width / 2, canvas.height / 2 + 20, 15, 20, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#8b4545";
        ctx.fill();
      } else {
        ctx.moveTo(canvas.width / 2 - 15, canvas.height / 2 + 20);
        ctx.quadraticCurveTo(canvas.width / 2, canvas.height / 2 + 25, canvas.width / 2 + 15, canvas.height / 2 + 20);
      }
      ctx.stroke();

      // Hair
      ctx.fillStyle = avatarGender === "female" ? "#8B4513" : "#654321";
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 - 80, 65, 0, Math.PI, true);
      ctx.fill();

      animationRef.current = requestAnimationFrame(() => {
        const nextMouthOpen = Math.random() > 0.5 && currentMessage.length > 0;
        drawAvatar(nextMouthOpen);
      });
    };

    drawAvatar(false);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [avatarGender, currentMessage]);

  const handleUserMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setCurrentMessage("");

    toast({ title: "Processing...", description: "LEARNORY is thinking..." });

    // Simulate AI response
    setTimeout(() => {
      const aiResponses = [
        "That's a great question! Let me explain this clearly...",
        "I understand. Here's how this works...",
        "Interesting! Let me break this down for you...",
        "Perfect! This is an important concept...",
        "Absolutely! Let me help you with that...",
      ];

      const response = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      const aiMsg: Message = { role: "assistant", content: response, timestamp: new Date() };
      setMessages((prev) => [...prev, aiMsg]);
      setCurrentMessage(response);

      // Speak the response
      if (isSpeakerOn) {
        const utterance = new SpeechSynthesisUtterance(response);
        utterance.rate = 1;
        utterance.pitch = avatarGender === "female" ? 1.2 : 0.8;
        window.speechSynthesis.speak(utterance);
      }
    }, 1500);
  };

  const toggleCall = () => {
    if (isCallActive) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    }
    setIsCallActive(!isCallActive);
  };

  if (!isCallActive) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 items-center justify-center">
        <Card className="p-8 bg-slate-800/50 border-purple-500/20 text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Call Ended
          </h1>
          <p className="text-slate-300 mb-6">Thank you for learning with LEARNORY AI</p>
          <Button onClick={() => setIsCallActive(true)} size="lg" className="w-full mb-3">
            Start New Call
          </Button>
          <Link href="/chat">
            <Button variant="outline" className="w-full">
              Back to Chat
            </Button>
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
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
            <h1 className="text-2xl font-bold text-white">LEARNORY LIVE AI</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2 bg-slate-700/50 rounded-lg p-2">
              <Button
                variant={avatarGender === "female" ? "default" : "ghost"}
                size="sm"
                onClick={() => setAvatarGender("female")}
                data-testid="button-avatar-female"
                className="gap-2"
              >
                Female
              </Button>
              <Button
                variant={avatarGender === "male" ? "default" : "ghost"}
                size="sm"
                onClick={() => setAvatarGender("male")}
                data-testid="button-avatar-male"
                className="gap-2"
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
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Avatar Section */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <Card className="w-full h-96 bg-gradient-to-br from-purple-600/10 to-pink-600/10 border-purple-500/30 backdrop-blur flex items-center justify-center overflow-hidden">
            <div ref={videoRef} className="w-full h-full flex items-center justify-center bg-slate-900/50">
              <canvas
                ref={canvasRef}
                width={300}
                height={400}
                className="max-w-full h-auto drop-shadow-2xl"
                data-testid="canvas-avatar"
              />
            </div>
          </Card>

          {/* Live Status */}
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-400 mb-2">
              {isListening ? "Listening..." : "Ready to talk"}
            </p>
            <div className="text-lg font-semibold text-white min-h-6">
              {currentMessage && `"${currentMessage}"`}
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex gap-3 flex-wrap justify-center">
            <Button
              variant={isMuted ? "destructive" : "default"}
              size="lg"
              onClick={() => setIsMuted(!isMuted)}
              data-testid="button-mute"
              className="gap-2"
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {isMuted ? "Muted" : "Listening"}
            </Button>

            <Button
              variant={isSpeakerOn ? "default" : "outline"}
              size="lg"
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              data-testid="button-speaker"
              className="gap-2"
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              Speaker
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onClick={toggleCall}
              data-testid="button-end-call"
              className="gap-2"
            >
              <PhoneOff className="w-5 h-5" />
              End Call
            </Button>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 bg-slate-800/50 border-slate-700 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-700">
              <h2 className="font-bold text-white">Conversation</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <Loader className="w-8 h-8 text-purple-400 mx-auto mb-2 animate-spin" />
                    <p className="text-slate-400">Start speaking to begin...</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${msg.role}-${i}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.role === "user"
                          ? "bg-purple-600 text-white"
                          : "bg-slate-700 text-slate-100"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-50 mt-1">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Info */}
            <div className="p-4 border-t border-slate-700 bg-slate-900/50">
              <p className="text-xs text-slate-400 text-center">
                🎤 Speak naturally • AI will respond in real-time
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
