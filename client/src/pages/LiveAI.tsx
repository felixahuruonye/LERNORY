import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mic,
  MicOff,
  PhoneOff,
  Settings,
  Upload,
  Moon,
  Sun,
  FileUp,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ChatInterface } from "@/components/live-ai/ChatInterface";
import { QuickActions } from "@/components/live-ai/QuickActions";
import { VoiceSettings } from "@/components/live-ai/VoiceSettings";
import { StudyTimer } from "@/components/live-ai/StudyTimer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function LiveAI() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<string>("ask-question");

  // Voice state
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [voice, setVoice] = useState("female");
  const [speed, setSpeed] = useState(1);
  const [language, setLanguage] = useState("en");
  const [tone, setTone] = useState("friendly");
  const [isDarkMode, setIsDarkMode] = useState(true);

  // UI state
  const [showFileUpload, setShowFileUpload] = useState(false);

  // Load settings and messages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("learnory_live_ai_settings");
    if (saved) {
      const settings = JSON.parse(saved);
      setVoice(settings.voice);
      setSpeed(settings.speed);
      setLanguage(settings.language);
      setTone(settings.tone);
      setIsDarkMode(settings.isDarkMode);
    }

    const savedMessages = localStorage.getItem("learnory_chat_messages");
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to load messages:", e);
      }
    }

    initSpeechRecognition();
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    const settings = { voice, speed, language, tone, isDarkMode };
    localStorage.setItem("learnory_live_ai_settings", JSON.stringify(settings));
  }, [voice, speed, language, tone, isDarkMode]);

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem("learnory_chat_messages", JSON.stringify(messages));
  }, [messages]);

  // Initialize speech recognition
  const initSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            handleSendMessage(transcript);
            transcript = "";
          }
        }
      };
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
      };

      recognitionRef.current = recognition;
    }
  };

  // Handle voice toggling
  const toggleVoice = async () => {
    if (isVoiceActive) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsVoiceActive(false);
      setIsListening(false);
    } else {
      if (recognitionRef.current && !isMuted) {
        recognitionRef.current.start();
      }
      setIsVoiceActive(true);
    }
  };

  // Handle mute
  const toggleMute = () => {
    if (recognitionRef.current) {
      if (isMuted) {
        recognitionRef.current.start();
      } else {
        recognitionRef.current.stop();
      }
    }
    setIsMuted(!isMuted);
  };

  // Send message with mode context
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Create mode-aware prompt
      const modePrompts: Record<string, string> = {
        "explain": "Explain this concept clearly with examples:",
        "past-questions": "Help me solve this past question:",
        "scan-image": "Analyze this image and explain:",
        "summarize": "Summarize the key points:",
        "voice-tutor": "Teach me about this topic:",
        "study-plan": "Create a study plan for:",
        "mock-exam": "Generate a mock exam question about:",
        "lesson-replay": "Replay the lesson on:",
        "topic-breakdown": "Break down this topic step-by-step:",
        "ask-question": "Answer this question:",
      };

      const modePrefix = modePrompts[currentMode] || modePrompts["ask-question"];
      const fullPrompt = `${modePrefix} ${content}`;

      // Simulate AI response (will integrate with Vapi API later)
      const responses = [
        `Great question about ${content.split(" ")[0]}! Let me explain...`,
        `I understand you're asking about this. Here's what you need to know...`,
        `This is an important concept. Let me break it down for you...`,
        `Perfect question! Let me provide a detailed explanation...`,
      ];

      const response =
        responses[Math.floor(Math.random() * responses.length)];

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Text-to-speech (will be replaced with Vapi voice)
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(response);
        utterance.rate = speed;
        utterance.pitch = voice === "female" ? 1.2 : 0.8;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear chat
  const handleClearChat = () => {
    if (confirm("Clear all messages?")) {
      setMessages([]);
      localStorage.removeItem("learnory_chat_messages");
    }
  };

  // Export chat
  const handleExportChat = () => {
    const text = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "learnory-chat.txt";
    a.click();
  };

  // Replay voice
  const handleReplayVoice = (content: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.rate = speed;
      utterance.pitch = voice === "female" ? 1.2 : 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show file upload notification
    toast({
      title: "File Uploaded",
      description: `${file.name} uploaded. Analyzing...`,
    });

    setShowFileUpload(false);

    // Simulate file analysis
    const fileAnalysisMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: `I've analyzed ${file.name}. This appears to be a ${file.type} file. How can I help you with this?`,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, fileAnalysisMessage]);
  };

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-white to-slate-100"}`}
    >
      {/* Header */}
      <header
        className={`${isDarkMode ? "bg-gradient-to-r from-slate-900/95 to-slate-800/95" : "bg-gradient-to-r from-white to-slate-100"} backdrop-blur-xl border-b ${isDarkMode ? "border-purple-500/20" : "border-slate-300"} p-4 sticky top-0 z-50`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-purple-500" />
            <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              LEARNORY LIVE AI
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsDarkMode(!isDarkMode)}
              data-testid="button-theme-toggle"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowSettings(!showSettings)}
              data-testid="button-settings"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Link href="/chat">
              <Button variant="outline" size="sm">
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Voice Controls */}
            <Card className={`p-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
              <h3 className={`font-bold mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Voice Control
              </h3>
              <div className="space-y-2">
                <Button
                  onClick={toggleVoice}
                  variant={isVoiceActive ? "default" : "outline"}
                  className="w-full gap-2"
                  data-testid="button-voice-toggle"
                >
                  {isVoiceActive ? (
                    <>
                      <Mic className="w-4 h-4" />
                      Listening
                    </>
                  ) : (
                    <>
                      <MicOff className="w-4 h-4" />
                      Start Listening
                    </>
                  )}
                </Button>
                <Button
                  onClick={toggleMute}
                  variant={isMuted ? "destructive" : "outline"}
                  className="w-full gap-2"
                  data-testid="button-mute"
                >
                  {isMuted ? "Muted" : "Active"}
                </Button>
              </div>
            </Card>

            {/* Study Timer */}
            <StudyTimer />

            {/* Settings Panel */}
            {showSettings && (
              <VoiceSettings
                onClose={() => setShowSettings(false)}
                voice={voice}
                speed={speed}
                language={language}
                tone={tone}
                onVoiceChange={setVoice}
                onSpeedChange={setSpeed}
                onLanguageChange={setLanguage}
                onToneChange={setTone}
              />
            )}

            {/* File Upload */}
            <Card className={`p-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
              <h3 className={`font-bold mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Upload Files
              </h3>
              <input
                type="file"
                id="file-upload"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                data-testid="input-file-upload"
              />
              <Button
                onClick={() => document.getElementById("file-upload")?.click()}
                variant="outline"
                className="w-full gap-2"
                data-testid="button-upload-file"
              >
                <Upload className="w-4 h-4" />
                Upload File
              </Button>
              <p className={`text-xs mt-2 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                Images, PDF, Documents
              </p>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Quick Actions */}
            <Card className={`p-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
              <h3 className={`font-bold mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                AI Learning Tools
              </h3>
              <QuickActions onModeSelect={setCurrentMode} />
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="chat" className="w-full">
              <TabsList
                className={`w-full ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}
              >
                <TabsTrigger value="chat" data-testid="tab-chat">
                  Chat
                </TabsTrigger>
                <TabsTrigger value="transcript" data-testid="tab-transcript">
                  Transcript
                </TabsTrigger>
                <TabsTrigger value="notes" data-testid="tab-notes">
                  Notes
                </TabsTrigger>
                <TabsTrigger value="documents" data-testid="tab-documents">
                  Documents
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="h-96">
                <ChatInterface
                  messages={messages}
                  isLoading={isLoading}
                  onSendMessage={handleSendMessage}
                  onClearChat={handleClearChat}
                  onExportChat={handleExportChat}
                  onReplayVoice={handleReplayVoice}
                />
              </TabsContent>

              <TabsContent value="transcript">
                <Card className={`p-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                  <p className={isDarkMode ? "text-slate-300" : "text-slate-600"}>
                    Real-time transcript will appear here as you speak
                  </p>
                </Card>
              </TabsContent>

              <TabsContent value="notes">
                <Card className={`p-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                  <p className={isDarkMode ? "text-slate-300" : "text-slate-600"}>
                    Your study notes will be saved here
                  </p>
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <Card className={`p-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                  <p className={isDarkMode ? "text-slate-300" : "text-slate-600"}>
                    Uploaded documents will appear here
                  </p>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
