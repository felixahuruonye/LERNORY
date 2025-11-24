import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send,
  Mic,
  MicOff,
  PhoneOff,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChatInterface } from "@/components/live-ai/ChatInterface";
import { QuickActions } from "@/components/live-ai/QuickActions";
import { VoiceSettings } from "@/components/live-ai/VoiceSettings";
import { StudyTimer } from "@/components/live-ai/StudyTimer";
import { AvatarDisplay } from "@/components/live-ai/AvatarDisplay";
import { vapiClient } from "@/lib/vapiClient";

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
  const initRef = useRef(false);

  // Load settings on mount
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

    // Initialize Vapi only once
    if (!initRef.current) {
      initRef.current = true;
      initializeVapi();
    }
  }, []);

  const initializeVapi = async () => {
    try {
      const res = await fetch("/api/vapi-config");
      if (!res.ok) throw new Error("Failed to fetch Vapi config");

      const { publicKey } = await res.json();

      // Initialize Vapi with public key
      await vapiClient.initialize(publicKey);

      // Setup event listeners
      vapiClient.on("callStart", () => {
        setIsVoiceActive(true);
      });

      vapiClient.on("callEnd", () => {
        setIsVoiceActive(false);
        setIsListening(false);
      });

      vapiClient.on("speechStart", () => {
        setIsListening(true);
      });

      vapiClient.on("speechEnd", () => {
        setIsListening(false);
      });

      vapiClient.on("transcript", (data: any) => {
        if (data.role === "assistant" && data.content) {
          // Add AI message with streaming effect
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.role === "assistant" && !lastMsg.content.endsWith(" ")) {
              return prev.map((msg, i) =>
                i === prev.length - 1
                  ? {
                      ...msg,
                      content: msg.content + " " + data.content,
                    }
                  : msg
              );
            }
            return [
              ...prev,
              {
                id: `ai-${Date.now()}`,
                role: "assistant",
                content: data.content,
                timestamp: Date.now(),
              },
            ];
          });
        }
      });

      vapiClient.on("error", (error: any) => {
        console.error("Vapi error:", error);
        toast({
          title: "Connection Error",
          description: error?.message || "Voice error",
          variant: "destructive",
        });
      });

      // Auto-start the call
      await autoStartCall();
    } catch (error) {
      console.error("Failed to initialize Vapi:", error);
      toast({
        title: "Initialization Error",
        description: "Could not initialize voice",
        variant: "destructive",
      });
    }
  };

  const autoStartCall = async () => {
    try {
      const systemPrompt = `You are LEARNORY ULTRA, an advanced AI tutor with a ${tone} speaking style.
Learning mode: ${currentMode}
Language: ${language}
Keep responses clear, concise, and conversational. Speak naturally as if talking to a student.`;

      await vapiClient.startCall({
        voice,
        speed,
        systemPrompt,
        firstMessage: `Hello! I'm your LEARNORY AI tutor. I'm here to help you with ${currentMode}. What would you like to learn about?`,
      });

      // Add greeting to chat
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          content: "Connected! I'm ready to help you learn.",
          timestamp: Date.now(),
        },
      ]);

      toast({
        title: "Connected",
        description: "LEARNORY Live AI is ready. Speak naturally or type below.",
      });
    } catch (error) {
      console.error("Failed to start call:", error);
      setTimeout(autoStartCall, 2000);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageInput,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setMessageInput("");

    // Send via Vapi - it will handle the response
    try {
      // Create a virtual message that gets sent through Vapi
      const tempId = `temp-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          role: "assistant",
          content: "Processing...",
          timestamp: Date.now(),
        },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleToggleMute = async () => {
    try {
      if (isMuted) {
        await vapiClient.unmute();
      } else {
        await vapiClient.mute();
      }
      setIsMuted(!isMuted);
    } catch (error) {
      console.error("Failed to toggle mute:", error);
    }
  };

  const handleEndCall = async () => {
    try {
      await vapiClient.stopCall();
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

              {/* Theme Toggle */}
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
                  className="w-full gap-2"
                  data-testid="button-theme"
                >
                  {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
                </Button>
              </Card>
            </div>

            {/* Main Content */}
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

              {/* Chat Tabs */}
              <Tabs defaultValue="chat" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="input">Type Message</TabsTrigger>
                </TabsList>

                <TabsContent value="chat">
                  <ChatInterface
                    messages={messages}
                    isLoading={false}
                    isDarkMode={isDarkMode}
                  />
                </TabsContent>

                <TabsContent value="input">
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
                        className="resize-none"
                        rows={4}
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
