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
  const vapiRef = useRef<any>(null);
  const callStartedRef = useRef(false);
  const messageCountRef = useRef(0);
  const [publicKey, setPublicKey] = useState("");

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

    // Fetch public key and initialize
    fetchVapiKeyAndInitialize();
  }, []);

  const fetchVapiKeyAndInitialize = async () => {
    try {
      const res = await fetch("/api/vapi-config");
      if (!res.ok) throw new Error("Failed to fetch Vapi config");

      const { publicKey: key } = await res.json();
      setPublicKey(key);

      // Load Vapi SDK with proper script tag
      loadVapiScript(key);
    } catch (error) {
      console.error("Failed to fetch Vapi key:", error);
      toast({
        title: "Configuration Error",
        description: "Could not load voice service configuration",
        variant: "destructive",
      });
    }
  };

  const loadVapiScript = (key: string) => {
    // Create script tag for Vapi SDK - use proper ESM format
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@vapi-ai/web";
    script.type = "module";

    script.innerHTML = `
      import Vapi from 'https://cdn.jsdelivr.net/npm/@vapi-ai/web';
      window.VapiSDK = Vapi;
      window.VapiReady = true;
    `;

    script.onload = () => {
      console.log("Vapi script loaded, initializing...");
      // Give it time to execute
      setTimeout(() => {
        if ((window as any).VapiReady) {
          initializeVapi(key);
        }
      }, 500);
    };

    script.onerror = () => {
      console.error("Failed to load Vapi script");
      // Fallback: try loading from alternative CDN
      loadVapiAlternative(key);
    };

    document.head.appendChild(script);
  };

  const loadVapiAlternative = (key: string) => {
    // Alternative: Load Vapi using global script
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/gh/VapiAI/web@latest/dist/vapi.min.js";
    script.async = true;

    script.onload = () => {
      console.log("Vapi alternative loaded");
      setTimeout(() => {
        initializeVapi(key);
      }, 500);
    };

    script.onerror = () => {
      console.error("Failed to load Vapi from alternative CDN");
      toast({
        title: "SDK Load Error",
        description: "Could not load voice SDK. Please refresh.",
        variant: "destructive",
      });
    };

    document.head.appendChild(script);
  };

  const initializeVapi = (key: string) => {
    try {
      // Get Vapi constructor - try multiple possible locations
      let Vapi = (window as any).Vapi || (window as any).VapiSDK || (window as any).default;

      if (!Vapi) {
        console.error("Vapi SDK not found on window");
        setTimeout(() => initializeVapi(key), 1000);
        return;
      }

      console.log("Initializing Vapi with key:", key.substring(0, 10) + "...");

      // Create Vapi instance
      vapiRef.current = new Vapi({
        apiKey: key,
        onCallStart: () => {
          console.log("Vapi call started");
          setIsVoiceActive(true);
          callStartedRef.current = true;
          addChatMessage("assistant", "Call connected! How can I help you learn?");
        },
        onCallEnd: () => {
          console.log("Vapi call ended");
          setIsVoiceActive(false);
          setIsListening(false);
          callStartedRef.current = false;
        },
        onSpeechStart: () => {
          console.log("Speech start");
          setIsListening(true);
        },
        onSpeechEnd: () => {
          console.log("Speech end");
          setIsListening(false);
        },
        onMessage: (message: any) => {
          console.log("Vapi message:", message);
          if (message.type === "transcript" && message.transcript) {
            if (message.role === "assistant") {
              addChatMessage("assistant", message.transcript);
            }
          }
        },
        onError: (error: any) => {
          console.error("Vapi error:", error);
          toast({
            title: "Voice Error",
            description: error?.message || "Voice connection failed",
            variant: "destructive",
          });
        },
      });

      // Start call automatically
      startCallAutomatically();
    } catch (error) {
      console.error("Error initializing Vapi:", error);
      toast({
        title: "Initialization Error",
        description: "Could not initialize voice service",
        variant: "destructive",
      });
    }
  };

  const startCallAutomatically = () => {
    if (!vapiRef.current || callStartedRef.current) return;

    try {
      const systemPrompt = `You are LEARNORY ULTRA, an advanced AI tutor.
Your speaking style: ${tone}
Language: ${language}
Learning mode: ${currentMode}
Rules:
- Keep responses SHORT and CLEAR
- Speak naturally and conversationally
- Maximum 2-3 sentences per response
- Be friendly and encouraging
- Identify and address learning topics`;

      console.log("Starting Vapi call with system prompt...");

      vapiRef.current.start({
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          temperature: 0.7,
          systemPrompt,
        },
        voice: {
          provider: "openai",
          voiceId: voice === "female" ? "nova" : "onyx",
        },
        name: "LEARNORY AI Tutor",
        firstMessage: "Hello! I'm your LEARNORY AI tutor. What would you like to learn today?",
        endCallMessage: "Thank you for learning with LEARNORY. Keep up the great work!",
      });

      toast({
        title: "Connected",
        description: "LEARNORY Live AI is ready. Speak naturally!",
      });
    } catch (error) {
      console.error("Error starting Vapi call:", error);
      // Retry
      setTimeout(startCallAutomatically, 2000);
    }
  };

  const addChatMessage = (role: "user" | "assistant", content: string) => {
    const msg: Message = {
      id: `${role}-${messageCountRef.current++}`,
      role,
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !vapiRef.current) return;

    addChatMessage("user", messageInput);
    setMessageInput("");
  };

  const handleToggleMute = () => {
    if (!vapiRef.current) return;
    try {
      if (isMuted) {
        vapiRef.current.unmute();
        setIsMuted(false);
      } else {
        vapiRef.current.mute();
        setIsMuted(true);
      }
    } catch (error) {
      console.error("Failed to toggle mute:", error);
    }
  };

  const handleEndCall = () => {
    if (!vapiRef.current) return;
    try {
      vapiRef.current.stop();
      setIsVoiceActive(false);
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
