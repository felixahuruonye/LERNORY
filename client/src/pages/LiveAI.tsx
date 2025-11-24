import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
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
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const messageCountRef = useRef(0);
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
      initializeSpeechRecognition();
      synthRef.current = window.speechSynthesis;
      
      // Auto-start with greeting
      setTimeout(() => {
        setIsVoiceActive(true);
        const greetings = [
          "Hello! I'm your LEARNORY AI tutor. What would you like to learn today?",
          "Hi! I'm here to help you learn. What topic interests you?",
          "Welcome to LEARNORY! I'm ready to assist with your studies.",
        ];
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        addMessage("assistant", greeting);
        speakMessage(greeting);
        toast({ title: "Connected", description: "LEARNORY Live AI is ready!" });
      }, 500);
    }
  }, []);

  const initializeSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech Recognition not supported");
      toast({
        title: "Browser Support",
        description: "Speech recognition not supported in your browser",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = language;

    recognition.onstart = () => {
      console.log("Listening...");
      setIsListening(true);
    };

    recognition.onend = () => {
      console.log("Stopped listening");
      setIsListening(false);
      if (isVoiceActive) {
        recognition.start(); // Restart for continuous listening
      }
    };

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      if (event.results[event.results.length - 1].isFinal && transcript.trim()) {
        console.log("Final transcript:", transcript);
        handleUserSpeech(transcript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
    };

    recognitionRef.current = recognition;
  };

  const handleUserSpeech = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    addMessage("user", text);

    // Get AI response
    try {
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          sessionId: null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage = data.message || data.content || "I understood your question. Let me help you with that.";
        addMessage("assistant", aiMessage);
        speakMessage(aiMessage);
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMsg = "Sorry, I encountered an error. Could you repeat that?";
      addMessage("assistant", errorMsg);
      speakMessage(errorMsg);
    }
  };

  const speakMessage = (text: string) => {
    if (!synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;
    utterance.pitch = voice === "female" ? 1.2 : 0.8;
    utterance.volume = 1;

    utterance.onstart = () => {
      console.log("Speaking...");
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      console.log("Done speaking");
      setIsSpeaking(false);
    };

    utterance.onerror = (event: any) => {
      console.error("Speech synthesis error:", event.error);
    };

    synthRef.current.speak(utterance);
  };

  const addMessage = (role: "user" | "assistant", content: string) => {
    const msg: Message = {
      id: `${role}-${++messageCountRef.current}`,
      role,
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    const userText = messageInput;
    setMessageInput("");

    addMessage("user", userText);
    speakMessage(`User asked: ${userText}`);

    try {
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: userText,
          sessionId: null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage = data.message || data.content || "Got it! Let me help you.";
        addMessage("assistant", aiMessage);
        speakMessage(aiMessage);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMsg = "Sorry, I encountered an error processing your request.";
      addMessage("assistant", errorMsg);
      speakMessage(errorMsg);
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && synthRef.current) {
      synthRef.current.pause();
    } else if (isMuted && synthRef.current) {
      synthRef.current.resume();
    }
  };

  const handleEndCall = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsVoiceActive(false);
    setIsListening(false);
  };

  const handleStartListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsVoiceActive(true);
      recognitionRef.current.start();
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
                    onClick={handleStartListening}
                    disabled={isListening}
                    variant="default"
                    className="w-full gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    {isListening ? "Listening..." : "Start Listening"}
                  </Button>
                  <Button
                    onClick={handleToggleMute}
                    variant={isMuted ? "destructive" : "outline"}
                    className="w-full gap-2"
                  >
                    {isMuted ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        Muted
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        Speaking
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
                <AvatarDisplay 
                  voice={voice} 
                  isActive={isSpeaking} 
                  isListening={isListening} 
                />
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
                        Send & Speak
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
