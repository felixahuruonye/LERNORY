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
  const vapiWebRef = useRef<any>(null);
  const messageCountRef = useRef(0);

  // Load settings
  useEffect(() => {
    const saved = localStorage.getItem("learnory_live_ai_settings");
    if (saved) {
      const settings = JSON.parse(saved);
      setVoice(settings.voice || "female");
      setSpeed(settings.speed || 1);
      setLanguage(settings.language || "en");
      setTone(settings.tone || "friendly");
      setIsDarkMode(settings.isDarkMode || false);
    }

    const savedMessages = localStorage.getItem("learnory_chat_messages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    // Load Vapi Web SDK
    loadVapiSDK();
  }, []);

  const loadVapiSDK = () => {
    // Check if Vapi web is already loaded
    if ((window as any).Vapi) {
      initializeVapiCall();
      return;
    }

    // Create and load Vapi script
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@vapi-ai/web";
    script.type = "module";
    script.onload = () => {
      console.log("Vapi SDK loaded");
      setTimeout(initializeVapiCall, 500);
    };
    script.onerror = () => {
      console.error("Failed to load Vapi SDK");
      toast({
        title: "Vapi Error",
        description: "Could not load voice service",
        variant: "destructive",
      });
    };
    document.body.appendChild(script);
  };

  const initializeVapiCall = async () => {
    try {
      // Fetch Vapi public key
      const res = await fetch("/api/vapi-config");
      if (!res.ok) {
        throw new Error("Failed to fetch Vapi config");
      }

      const { publicKey } = await res.json();

      // Check if Vapi is available
      if (!(window as any).Vapi) {
        console.error("Vapi SDK not loaded");
        return;
      }

      // Create Vapi instance
      const vapi = new (window as any).Vapi(publicKey);
      vapiWebRef.current = vapi;

      // Setup event listeners
      vapi.on("call-start", () => {
        console.log("Call started");
        setIsVoiceActive(true);
        addMessage("assistant", "Call connected. Let's start learning!");
      });

      vapi.on("call-end", () => {
        console.log("Call ended");
        setIsVoiceActive(false);
        setIsListening(false);
      });

      vapi.on("speech-start", () => {
        console.log("User started speaking");
        setIsListening(true);
      });

      vapi.on("speech-end", () => {
        console.log("User finished speaking");
        setIsListening(false);
      });

      vapi.on("message", (msg: any) => {
        console.log("Message from Vapi:", msg);
        if (msg.type === "transcript") {
          if (msg.role === "assistant") {
            addMessage("assistant", msg.transcript);
          }
        }
      });

      vapi.on("error", (error: any) => {
        console.error("Vapi error:", error);
        toast({
          title: "Voice Error",
          description: error?.message || "Voice connection error",
          variant: "destructive",
        });
      });

      // Start the call
      console.log("Starting Vapi call...");
      const systemPrompt = `You are LEARNORY ULTRA, an advanced AI tutor.
Tone: ${tone}
Language: ${language}
Mode: ${currentMode}
Keep responses short, clear, and conversational. You are speaking, not writing.`;

      await vapi.start({
        name: "LEARNORY AI Tutor",
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          systemPrompt,
        },
        voice: {
          provider: "openai",
          voiceId: voice === "female" ? "nova" : "onyx",
        },
        firstMessage: "Hello! I'm your LEARNORY AI tutor. What would you like to learn about today?",
        endCallMessage: "Thank you for learning. Keep up the great work!",
      });

      toast({
        title: "Connected",
        description: "LEARNORY Live AI is ready. Speak naturally!",
      });
    } catch (error) {
      console.error("Failed to initialize Vapi:", error);
      toast({
        title: "Connection Error",
        description: "Could not start voice conversation",
        variant: "destructive",
      });
      // Retry after 2 seconds
      setTimeout(initializeVapiCall, 2000);
    }
  };

  const addMessage = (role: "user" | "assistant", content: string) => {
    const msg: Message = {
      id: `${role}-${messageCountRef.current++}`,
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

    // The Vapi conversation will handle responses automatically
  };

  const handleToggleMute = async () => {
    try {
      if (vapiWebRef.current) {
        if (isMuted) {
          await vapiWebRef.current.unmute();
          setIsMuted(false);
        } else {
          await vapiWebRef.current.mute();
          setIsMuted(true);
        }
      }
    } catch (error) {
      console.error("Failed to toggle mute:", error);
    }
  };

  const handleEndCall = async () => {
    try {
      if (vapiWebRef.current) {
        await vapiWebRef.current.stop();
        setIsVoiceActive(false);
      }
    } catch (error) {
      console.error("Failed to end call:", error);
    }
  };

  // Save settings
  useEffect(() => {
    const settings = { voice, speed, language, tone, isDarkMode };
    localStorage.setItem("learnory_live_ai_settings", JSON.stringify(settings));
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
              <Card
                className={`p-4 ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
              >
                <h3
                  className={`font-bold mb-3 ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  Call Controls
                </h3>
                <div className="space-y-2">
                  <Button
                    onClick={handleToggleMute}
                    variant={isMuted ? "destructive" : "default"}
                    className="w-full gap-2"
                    data-testid="button-mute"
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
                  <Button
                    onClick={handleEndCall}
                    variant="destructive"
                    className="w-full gap-2"
                    data-testid="button-end-call"
                  >
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
              <Card
                className={`p-4 ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
              >
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
                <AvatarDisplay
                  voice={voice}
                  isActive={isVoiceActive}
                  isListening={isListening}
                />
              </Card>

              {/* Quick Actions */}
              <Card
                className={`p-4 ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
              >
                <h3
                  className={`font-bold mb-3 ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
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
                  <ChatInterface
                    messages={messages}
                    isLoading={false}
                    isDarkMode={isDarkMode}
                  />
                </TabsContent>

                <TabsContent value="type">
                  <Card
                    className={`p-4 ${
                      isDarkMode
                        ? "bg-slate-800 border-slate-700"
                        : "bg-white border-slate-200"
                    }`}
                  >
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
