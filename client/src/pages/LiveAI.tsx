import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
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
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentMode, setCurrentMode] = useState("explain");
  const [messageInput, setMessageInput] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
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
      initializeAudio();
      
      // Auto-greet
      setTimeout(() => {
        const greetings = [
          "Hello! I'm your LEARNORY AI tutor. What would you like to learn today?",
          "Hi! I'm here to help you study. What topic interests you?",
          "Welcome to LEARNORY! I'm ready to assist with your learning.",
        ];
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        addMessage("assistant", greeting);
        playAudio(greeting);
      }, 1000);
    }
  }, []);

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        audioChunksRef.current = [];
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      toast({ title: "Microphone Ready", description: "LEARNORY Live AI is ready to listen!" });
    } catch (error) {
      console.error("Microphone access error:", error);
      toast({
        title: "Microphone Error",
        description: "Please enable microphone access",
        variant: "destructive",
      });
    }
  };

  const startRecording = () => {
    if (!mediaRecorderRef.current) return;
    
    audioChunksRef.current = [];
    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Upload audio to transcribe
      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.wav");

      const transcribeRes = await fetch("/api/audio/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeRes.ok) {
        throw new Error("Transcription failed");
      }

      const { text } = await transcribeRes.json();
      console.log("Transcribed:", text);

      if (!text?.trim()) {
        toast({ description: "Could not understand audio. Please try again." });
        setIsProcessing(false);
        return;
      }

      // Add user message
      addMessage("user", text);

      // Get AI response
      const chatRes = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, sessionId: null }),
      });

      if (!chatRes.ok) {
        throw new Error("AI response failed");
      }

      const chatData = await chatRes.json();
      const aiMessage = chatData.message || chatData.content || "I understood your question. Let me help you.";
      addMessage("assistant", aiMessage);

      // Play AI response as speech
      await playAudio(aiMessage);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to process audio",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = async (text: string) => {
    setIsSpeaking(true);
    try {
      const response = await fetch("/api/audio/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: voice === "female" ? "nova" : "onyx" }),
      });

      if (!response.ok) {
        // If speech service fails, use browser's native speech synthesis as fallback
        console.log("Using browser speech synthesis fallback...");
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speed;
        utterance.pitch = voice === "female" ? 1.2 : 0.8;
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsSpeaking(false);
      };

      audio.play().catch(() => {
        // If playback fails, use browser speech synthesis
        console.log("Using browser speech synthesis fallback...");
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speed;
        utterance.pitch = voice === "female" ? 1.2 : 0.8;
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      });
    } catch (error) {
      console.error("Audio playback error:", error);
      setIsSpeaking(false);
      // Use fallback
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speed;
        utterance.pitch = voice === "female" ? 1.2 : 0.8;
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        toast({
          title: "Audio Error",
          description: "Speech unavailable - try typing instead",
          variant: "destructive",
        });
      }
    }
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
    setIsProcessing(true);

    try {
      addMessage("user", userText);

      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userText, sessionId: null }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const aiMessage = data.message || data.content || "Got it!";
      addMessage("assistant", aiMessage);
      await playAudio(aiMessage);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to process message",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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
              {/* Recording Controls */}
              <Card className={`p-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                <h3 className={`font-bold mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  Voice Control
                </h3>
                <div className="space-y-2">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                    variant={isRecording ? "destructive" : "default"}
                    className="w-full gap-2"
                    data-testid={isRecording ? "button-stop-recording" : "button-start-recording"}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Start Recording
                      </>
                    )}
                  </Button>
                  <div className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    {isRecording && "🔴 Recording..."}
                    {isSpeaking && "🔊 Speaking..."}
                    {isProcessing && "⏳ Processing..."}
                  </div>
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
                  data-testid="button-toggle-theme"
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
                  isActive={isSpeaking || isRecording} 
                  isListening={isRecording}
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
              <Tabs defaultValue="voice" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="voice">Voice Chat</TabsTrigger>
                  <TabsTrigger value="type">Type Message</TabsTrigger>
                </TabsList>

                <TabsContent value="voice">
                  <ChatInterface messages={messages} isLoading={isProcessing} isDarkMode={isDarkMode} />
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
                        disabled={isProcessing}
                        data-testid="textarea-message"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || isProcessing}
                        className="w-full gap-2"
                        data-testid="button-send-message"
                      >
                        <Send className="w-4 h-4" />
                        Send & Listen
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
