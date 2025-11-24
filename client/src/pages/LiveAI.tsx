import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Settings,
  Send,
  Volume2,
  Mic,
  MicOff,
  PhoneOff,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChatInterface } from "@/components/live-ai/ChatInterface";
import { QuickActions } from "@/components/live-ai/QuickActions";
import { VoiceSettings } from "@/components/live-ai/VoiceSettings";
import { StudyTimer } from "@/components/live-ai/StudyTimer";
import { AvatarDisplay } from "@/components/live-ai/AvatarDisplay";
import { vapiWebService } from "@/lib/vapiWebService";

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
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState("explain");
  const [messageInput, setMessageInput] = useState("");

  const recognitionRef = useRef<any>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const initializingRef = useRef(false);

  // Load saved settings
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

    // Initialize Vapi and start auto voice call
    initializeVapi();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Initialize Vapi and auto-start call
  const initializeVapi = async () => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      const configRes = await fetch("/api/vapi-config");
      if (configRes.ok) {
        const { publicKey } = await configRes.json();
        await vapiWebService.initialize(publicKey);

        // Set up event handlers
        vapiWebService.on("callStart", () => {
          console.log("Vapi call started");
          setIsVoiceActive(true);
          initSpeechRecognition();
        });

        vapiWebService.on("callEnd", () => {
          console.log("Vapi call ended");
          setIsVoiceActive(false);
          setIsListening(false);
        });

        vapiWebService.on("speechStart", () => {
          setIsListening(true);
        });

        vapiWebService.on("speechEnd", () => {
          setIsListening(false);
        });

        vapiWebService.on("transcript", (transcript: any) => {
          handleUserSpeech(transcript.content);
        });

        vapiWebService.on("error", (error: any) => {
          console.error("Vapi error:", error);
          toast({
            title: "Connection Error",
            description: error?.message || "Voice connection error",
            variant: "destructive",
          });
        });

        // Auto-start the voice call
        await autoStartCall();
      } else {
        console.error("Failed to fetch Vapi config");
        toast({
          title: "Setup Error",
          description: "Could not load Vapi configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to initialize Vapi:", error);
      toast({
        title: "Initialization Error",
        description: "Could not initialize voice system",
        variant: "destructive",
      });
    }
  };

  // Auto-start voice call
  const autoStartCall = async () => {
    try {
      await vapiWebService.startCall({
        voice,
        speed,
        language,
        tone,
      });

      toast({
        title: "Connected",
        description: "LEARNORY Live AI is ready to help! Speak naturally or type below.",
      });

      // Add initial greeting message
      const greeting: Message = {
        id: `greeting-${Date.now()}`,
        role: "assistant",
        content: voice === "female"
          ? "Hello! I'm your LEARNORY AI tutor. I'm ready to help you learn today. What would you like to study?"
          : "Hello! I'm your LEARNORY AI tutor. What subject would you like to explore today?",
        timestamp: Date.now(),
      };
      setMessages([greeting]);
    } catch (error) {
      console.error("Failed to auto-start call:", error);
      toast({
        title: "Connection Issue",
        description: "Retrying connection...",
        variant: "destructive",
      });
      setTimeout(autoStartCall, 2000);
    }
  };

  // Handle user speech (from Vapi transcript)
  const handleUserSpeech = async (speech: string) => {
    if (!speech.trim()) return;
    console.log("User speech received:", speech);

    // Send to backend for AI response
    await sendMessageToBackend(speech);
  };

  // Initialize speech recognition
  const initSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = language;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            handleUserSpeech(transcript);
            transcript = "";
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  // Send message to backend for AI response
  const sendMessageToBackend = async (userMessage: string) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/live-ai/stream-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userMessage,
          mode: currentMode,
          voice,
          speed,
          language,
          tone,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Read the event stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let aiResponse = "";
      let messageId = `ai-${Date.now()}`;
      let aiMessageAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.substring(6);
            try {
              const data = JSON.parse(jsonStr);

              if (data.chunk) {
                aiResponse += data.chunk;

                // Add initial message if not yet added
                if (!aiMessageAdded) {
                  const assistantMsg: Message = {
                    id: messageId,
                    role: "assistant",
                    content: data.chunk,
                    timestamp: Date.now(),
                  };
                  setMessages((prev) => [...prev, assistantMsg]);
                  aiMessageAdded = true;
                } else {
                  // Update existing message with new chunk
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === messageId
                        ? { ...msg, content: msg.content + data.chunk }
                        : msg
                    )
                  );
                }

                // Send chunks to Vapi for voice output
                await vapiWebService.speakText(data.chunk);
              }

              if (data.isComplete) {
                break;
              }
            } catch (e) {
              console.error("Error parsing stream data:", e);
            }
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Handle manual message sending via input
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

    await sendMessageToBackend(messageInput);
  };

  // Toggle voice call
  const toggleVoice = async () => {
    try {
      await vapiWebService.stopCall();
      setIsVoiceActive(false);
    } catch (error) {
      console.error("Failed to toggle voice:", error);
    }
  };

  // Toggle mute
  const toggleMute = async () => {
    try {
      if (isMuted) {
        await vapiWebService.unmute();
      } else {
        await vapiWebService.mute();
      }
      setIsMuted(!isMuted);
    } catch (error) {
      console.error("Failed to toggle mute:", error);
    }
  };

  // Save settings to localStorage
  useEffect(() => {
    const settings = { voice, speed, language, tone, isDarkMode };
    localStorage.setItem("learnory_live_ai_settings", JSON.stringify(settings));
  }, [voice, speed, language, tone, isDarkMode]);

  // Save messages to localStorage
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
              {/* Voice Controls */}
              <Card className={`p-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                <h3 className={`font-bold mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  Call Controls
                </h3>
                <div className="space-y-2">
                  <Button
                    onClick={toggleMute}
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
                    onClick={toggleVoice}
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
              <Card className={`p-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                <Button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  variant="outline"
                  className="w-full gap-2"
                  data-testid="button-theme"
                >
                  {isDarkMode ? "☀️ Light" : "🌙 Dark"}
                </Button>
              </Card>
            </div>

            {/* Main Chat Area */}
            <div className="lg:col-span-3 space-y-4">
              {/* Avatar Display */}
              <Card className={`p-6 flex justify-center ${isDarkMode ? "bg-gradient-to-br from-purple-600/10 to-pink-600/10 border-purple-500/30" : "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200"}`}>
                <AvatarDisplay voice={voice} isActive={isVoiceActive} isListening={isListening} />
              </Card>

              {/* Quick Actions */}
              <Card className={`p-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                <h3 className={`font-bold mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  AI Learning Tools
                </h3>
                <QuickActions onModeSelect={setCurrentMode} />
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="chat" className="w-full">
                <TabsList className="w-full grid grid-cols-2" data-testid="tabs-live-ai">
                  <TabsTrigger value="chat" data-testid="tab-chat">
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="input" data-testid="tab-input">
                    Type Message
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="space-y-4">
                  <ChatInterface messages={messages} isLoading={isLoading} isDarkMode={isDarkMode} />
                </TabsContent>

                <TabsContent value="input" className="space-y-4">
                  <Card className={`p-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                    <div className="space-y-3">
                      <Textarea
                        ref={messageInputRef}
                        placeholder="Type your question or topic..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && e.ctrlKey) {
                            handleSendMessage();
                          }
                        }}
                        className="resize-none"
                        rows={4}
                        data-testid="input-message"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={isLoading || !messageInput.trim()}
                        className="w-full gap-2"
                        data-testid="button-send"
                      >
                        <Send className="w-4 h-4" />
                        Send Message
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
