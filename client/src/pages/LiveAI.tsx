import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChatInterface } from "@/components/live-ai/ChatInterface";
import { QuickActions } from "@/components/live-ai/QuickActions";
import { AvatarDisplay } from "@/components/live-ai/AvatarDisplay";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function LiveAI() {
  const { toast } = useToast();
  const [voice] = useState<"female" | "male">("female");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentMode, setCurrentMode] = useState("explain");
  const [messageInput, setMessageInput] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messageCountRef = useRef(0);
  const initRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mouthAnimationRef = useRef<boolean>(false);

  useEffect(() => {
    // Load saved settings
    const saved = localStorage.getItem("learnory_live_ai_settings");
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setIsDarkMode(settings.isDarkMode || false);
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    }

    // Don't load old messages - start fresh each session
    // This prevents confusion where old history interferes with new questions
    localStorage.removeItem("learnory_chat_messages");

    if (!initRef.current) {
      initRef.current = true;
      initializeContinuousListening();
      
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

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  // Continuous voice listening with Whisper
  const initializeContinuousListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      
      // Start continuous recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsListening(true);

      // Start listening for speech
      startSpeechDetection();
      
      toast({ 
        title: "Listening Ready", 
        description: "LEARNORY is listening... Speak naturally and I'll respond automatically!" 
      });
    } catch (error) {
      console.error("Microphone access error:", error);
      toast({
        title: "Microphone Error",
        description: "Please enable microphone access for voice input",
        variant: "destructive",
      });
    }
  };

  // Speech detection using browser's Speech Recognition API
  const startSpeechDetection = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Use type message instead",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let interimTranscript = "";

    recognition.onstart = () => {
      console.log("Speech recognition started");
    };

    recognition.onresult = (event: any) => {
      interimTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          // Final result - send to AI
          if (transcript.trim()) {
            clearTimeout(silenceTimeoutRef.current!);
            handleSendMessage(transcript.trim());
          }
        } else {
          interimTranscript += transcript;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        toast({
          title: "Speech Error",
          description: `Error: ${event.error}`,
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition ended, restarting...");
      // Restart continuous listening
      setTimeout(() => {
        if (initRef.current) {
          startSpeechDetection();
        }
      }, 100);
    };

    recognition.start();
    recognitionRef.current = recognition;
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

  // Play audio with mouth animation
  const playAudio = async (text: string) => {
    setIsSpeaking(true);
    mouthAnimationRef.current = true;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = voice === "female" ? 1.2 : 0.8;
      
      utterance.onend = () => {
        setIsSpeaking(false);
        mouthAnimationRef.current = false;
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
        mouthAnimationRef.current = false;
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech synthesis error:", e);
      setIsSpeaking(false);
      mouthAnimationRef.current = false;
    }
  };

  const handleSendMessage = async (userText?: string) => {
    const text = userText || messageInput;
    if (!text.trim() || isProcessing) return;

    setMessageInput("");
    setIsProcessing(true);

    try {
      addMessage("user", text);

      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, sessionId: null }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      console.log("API Response:", data);
      const aiMessage = data.message || "Got it!";
      console.log("AI Message to display:", aiMessage);
      if (!aiMessage || aiMessage.trim() === "") {
        throw new Error("Empty response from API");
      }
      addMessage("assistant", aiMessage);

      // Speak the response with avatar lip-syncing
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
      JSON.stringify({ isDarkMode })
    );
  }, [isDarkMode]);

  // Save messages
  useEffect(() => {
    localStorage.setItem("learnory_chat_messages", JSON.stringify(messages));
  }, [messages]);

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className={`min-h-screen ${isDarkMode ? "bg-slate-900" : "bg-slate-50"}`}>
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <div className="space-y-6">
            {/* Avatar with Action Buttons - Center Stage */}
            <div className="flex flex-col items-center gap-4">
              {/* Avatar Display */}
              <Card className={`p-6 w-full max-w-sm ${
                isDarkMode
                  ? "bg-gradient-to-br from-purple-600/10 to-pink-600/10 border-purple-500/30"
                  : "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200"
              }`}>
                <AvatarDisplay 
                  voice={voice} 
                  isActive={isSpeaking} 
                  isListening={isListening}
                  isMouthOpen={mouthAnimationRef.current}
                />
              </Card>

              {/* Status Indicator */}
              <div className={`text-sm font-medium ${
                isDarkMode ? "text-slate-300" : "text-slate-700"
              }`}>
                {isListening && "🎤 Listening..."}
                {isSpeaking && "🔊 Speaking..."}
                {isProcessing && "⏳ Thinking..."}
                {!isListening && !isSpeaking && !isProcessing && "Ready to listen"}
              </div>

              {/* Action Buttons */}
              <div className="w-full max-w-sm">
                <QuickActions onModeSelect={setCurrentMode} />
              </div>

              {/* Theme Toggle */}
              <Button
                onClick={() => setIsDarkMode(!isDarkMode)}
                variant="outline"
                size="sm"
                className="w-full max-w-sm"
                data-testid="button-toggle-theme"
              >
                {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
              </Button>
            </div>

            {/* Chat Interface - Below Avatar */}
            <div className="w-full">
              <ChatInterface 
                messages={messages} 
                isLoading={isProcessing} 
                onSendMessage={handleSendMessage}
                onClearChat={() => setMessages([])}
                onExportChat={() => {}}
              />
            </div>

            {/* Type Message Input - Simple */}
            <Card className={`p-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
              <div className="space-y-3">
                <Textarea
                  placeholder="Type your question (press Enter to send)..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={3}
                  className="resize-none"
                  disabled={isProcessing}
                  data-testid="textarea-message"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!messageInput.trim() || isProcessing}
                    className="flex-1 gap-2"
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                    {isProcessing ? "Thinking..." : "Send"}
                  </Button>
                  <Button
                    onClick={() => setMessageInput("")}
                    variant="outline"
                    size="sm"
                    data-testid="button-clear-input"
                  >
                    Clear
                  </Button>
                </div>
                <div className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  💬 Speak naturally or type your questions • Press Enter to send • Shift+Enter for new line
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
