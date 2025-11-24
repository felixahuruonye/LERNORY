import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Mic, MicOff, PhoneOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChatInterface } from "@/components/live-ai/ChatInterface";
import { QuickActions } from "@/components/live-ai/QuickActions";
import { VoiceSettings } from "@/components/live-ai/VoiceSettings";
import { StudyTimer } from "@/components/live-ai/StudyTimer";
import { AvatarDisplay } from "@/components/live-ai/AvatarDisplay";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

declare global {
  interface Window {
    Vapi: any;
  }
}

export default function LiveAI() {
  const { toast } = useToast();
  const [voice, setVoice] = useState<"female" | "male">("female");
  const [speed, setSpeed] = useState(1);
  const [language, setLanguage] = useState("en");
  const [tone, setTone] = useState("friendly");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentMode, setCurrentMode] = useState("explain");
  const [messageInput, setMessageInput] = useState("");

  const vapiInstanceRef = useRef<any>(null);
  const messageIdRef = useRef(0);
  const initRef = useRef(false);

  useEffect(() => {
    // Load settings
    const saved = localStorage.getItem("learnory_live_ai_settings");
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setVoice(settings.voice || "female");
        setSpeed(settings.speed || 1);
        setLanguage(settings.language || "en");
        setTone(settings.tone || "friendly");
        setIsDarkMode(settings.isDarkMode || false);
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    }

    const savedMessages = localStorage.getItem("learnory_chat_messages");
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to load messages:", e);
      }
    }

    if (!initRef.current) {
      initRef.current = true;
      initVapi();
    }
  }, []);

  const initVapi = async () => {
    try {
      // Fetch config
      const configRes = await fetch("/api/vapi-config");
      const { publicKey } = await configRes.json();

      // Load Vapi SDK
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest/dist/vapi.js";
      script.async = true;

      script.onload = () => {
        console.log("Vapi SDK loaded successfully");
        setTimeout(() => startVapiCall(publicKey), 1000);
      };

      script.onerror = () => {
        console.error("Failed to load Vapi SDK");
        toast({
          title: "SDK Error",
          description: "Could not load voice SDK",
          variant: "destructive",
        });
      };

      document.body.appendChild(script);
    } catch (error) {
      console.error("Init error:", error);
      toast({
        title: "Initialization Error",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const startVapiCall = async (publicKey: string) => {
    try {
      if (!window.Vapi) {
        console.error("Vapi not loaded");
        setTimeout(() => startVapiCall(publicKey), 500);
        return;
      }

      console.log("Creating Vapi instance...");

      // Create Vapi instance with direct call config
      vapiInstanceRef.current = new window.Vapi({
        apiKey: publicKey,
        onCallStart: () => {
          console.log("✓ Call started");
          setIsVoiceActive(true);
          addMessage("assistant", "Hello! I'm your LEARNORY AI tutor. I'm ready to help you learn!");
        },
        onCallEnd: () => {
          console.log("✓ Call ended");
          setIsVoiceActive(false);
          setIsListening(false);
        },
        onSpeechStart: () => {
          console.log("✓ Speech detected");
          setIsListening(true);
        },
        onSpeechEnd: () => {
          console.log("✓ Speech ended");
          setIsListening(false);
        },
        onMessage: (message: any) => {
          console.log("Message:", message);
          if (message?.transcript) {
            if (message.role === "assistant") {
              addMessage("assistant", message.transcript);
            }
          }
        },
        onError: (error: any) => {
          console.error("Vapi error:", error);
          toast({
            title: "Connection Error",
            description: error?.message || "Voice error",
            variant: "destructive",
          });
        },
      });

      console.log("Starting call...");

      // Start the call
      await vapiInstanceRef.current.start({
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are LEARNORY ULTRA - an advanced AI tutor. 
Tone: ${tone}
Language: ${language}  
Mode: ${currentMode}
RULES: Keep responses SHORT (max 2-3 sentences). Speak naturally like a real person. Be warm and encouraging.`,
            },
          ],
        },
        voice: {
          provider: "openai",
          voiceId: voice === "female" ? "nova" : "onyx",
        },
        firstMessage: `Hello! I'm your LEARNORY AI tutor in ${tone} mode. I'm here to help you with ${currentMode}. What would you like to learn?`,
      });

      toast({
        title: "Connected!",
        description: "Listening now. Speak naturally!",
      });
    } catch (error) {
      console.error("Failed to start call:", error);
      // Retry
      setTimeout(() => startVapiCall(publicKey), 2000);
    }
  };

  const addMessage = (role: "user" | "assistant", content: string) => {
    const msg: Message = {
      id: `${role}-${++messageIdRef.current}`,
      role,
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    addMessage("user", messageInput);
    setMessageInput("");
  };

  const handleToggleMute = async () => {
    if (!vapiInstanceRef.current) return;
    try {
      if (isMuted) {
        await vapiInstanceRef.current.unmute();
        setIsMuted(false);
      } else {
        await vapiInstanceRef.current.mute();
        setIsMuted(true);
      }
    } catch (error) {
      console.error("Mute error:", error);
    }
  };

  const handleEndCall = async () => {
    if (!vapiInstanceRef.current) return;
    try {
      await vapiInstanceRef.current.stop();
      setIsVoiceActive(false);
    } catch (error) {
      console.error("End call error:", error);
    }
  };

  // Save settings
  useEffect(() => {
    localStorage.setItem(
      "learnory_live_ai_settings",
      JSON.stringify({ voice, speed, language, tone, isDarkMode })
    );
  }, [voice, speed, language, tone, isDarkMode]);

  // Save messages
  useEffect(() => {
    localStorage.setItem("learnory_chat_messages", JSON.stringify(messages));
  }, [messages]);

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className={`min-h-screen ${isDarkMode ? "bg-slate-900" : "bg-slate-50"}`}>
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Call Controls */}
              <Card className={`p-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                <h3 className={`font-bold mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  Call Controls
                </h3>
                <div className="space-y-2">
                  <Button
                    onClick={handleToggleMute}
                    variant={isMuted ? "destructive" : "default"}
                    className="w-full gap-2"
                  >
                    {isMuted ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        Muted
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Unmuted
                      </>
                    )}
                  </Button>
                  <Button onClick={handleEndCall} variant="destructive" className="w-full gap-2">
                    <PhoneOff className="w-4 h-4" />
                    End Call
                  </Button>
                </div>
              </Card>

              {/* Study Timer */}
              <StudyTimer />

              {/* Voice Settings */}
              <VoiceSettings
                voice={voice}
                setVoice={setVoice}
                speed={speed}
                setSpeed={setSpeed}
                language={language}
                setLanguage={setLanguage}
                tone={tone}
                setTone={setTone}
                isDarkMode={isDarkMode}
              />

              {/* Theme */}
              <Card className={`p-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                <Button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  variant="outline"
                  className="w-full"
                >
                  {isDarkMode ? "☀️ Light" : "🌙 Dark"}
                </Button>
              </Card>
            </div>

            {/* Main */}
            <div className="lg:col-span-3 space-y-4">
              {/* Avatar */}
              <Card
                className={`p-6 flex justify-center ${
                  isDarkMode
                    ? "bg-gradient-to-br from-purple-600/10 to-pink-600/10 border-purple-500/30"
                    : "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200"
                }`}
              >
                <AvatarDisplay voice={voice} isActive={isVoiceActive} isListening={isListening} />
              </Card>

              {/* Quick Actions */}
              <Card className={`p-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                <h3 className={`font-bold mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  AI Learning Tools
                </h3>
                <QuickActions onModeSelect={setCurrentMode} />
              </Card>

              {/* Chat */}
              <Tabs defaultValue="chat" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="type">Type Message</TabsTrigger>
                </TabsList>

                <TabsContent value="chat">
                  <ChatInterface messages={messages} isLoading={false} isDarkMode={isDarkMode} />
                </TabsContent>

                <TabsContent value="type">
                  <Card className={`p-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Type your question..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && e.ctrlKey) {
                            handleSendMessage();
                          }
                        }}
                        rows={4}
                        className="resize-none"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className="w-full gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </Button>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
