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
  const [sessionId, setSessionId] = useState<string | null>(null);

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

    if (!initRef.current) {
      initRef.current = true;
      
      // Create a new chat session for this Live AI conversation
      (async () => {
        try {
          const response = await fetch("/api/chat/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "Live AI Session - " + new Date().toLocaleString(),
              mode: "live-ai",
              summary: "Interactive voice-based learning session"
            })
          });
          const session = await response.json();
          setSessionId(session.id);
          console.log("✓ Created chat session:", session.id);
        } catch (err) {
          console.error("Failed to create session:", err);
        }
      })();

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

  // Initialize Whisper voice listening
  const initializeContinuousListening = async () => {
    try {
      // Request microphone permission with echo cancellation
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = []; // Reset audio chunks
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      setIsListening(true);
      
      toast({ 
        title: "✓ Voice Ready", 
        description: "Listening... Speak naturally!" 
      });
      console.log("✓ Microphone ready - Waiting for speech");
      
      // Start voice activity detection
      startVoiceActivityDetection(mediaRecorder);
    } catch (error: any) {
      console.error("Microphone access error:", error);
      toast({
        title: "Microphone Error",
        description: "Please grant microphone permission",
        variant: "destructive",
      });
    }
  };

  // Voice activity detection and Whisper transcription
  const startVoiceActivityDetection = (mediaRecorder: MediaRecorder) => {
    let isRecording = false;
    let silenceTimer: NodeJS.Timeout | null = null;
    const SILENCE_THRESHOLD = 1500; // 1.5 seconds of silence = end of speech

    // Create audio context from the mediaRecorder's stream
    const stream = mediaRecorder.stream as MediaStream;
    const audioContext = new (window as any).AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkVoiceActivity = () => {
      analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const average = sum / dataArray.length;
      const hasVoice = average > 30; // Threshold for voice detection

      if (hasVoice && !isRecording) {
        // Start recording when voice detected
        isRecording = true;
        audioChunksRef.current = [];
        mediaRecorder.start();
        setIsListening(true);
        console.log("🎤 Recording started");
        
        if (silenceTimer) clearTimeout(silenceTimer);
      } else if (!hasVoice && isRecording) {
        // Start silence timer
        if (!silenceTimer) {
          silenceTimer = setTimeout(() => {
            // End recording after silence threshold
            isRecording = false;
            mediaRecorder.stop();
            setIsListening(false);
            console.log("🎤 Recording stopped - Processing with Whisper");
            
            // Send to Whisper for transcription
            setTimeout(() => transcribeWithWhisper(), 100);
            silenceTimer = null;
          }, SILENCE_THRESHOLD);
        }
      } else if (hasVoice && isRecording && silenceTimer) {
        // Clear silence timer if voice continues
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }

      requestAnimationFrame(checkVoiceActivity);
    };

    checkVoiceActivity();
  };

  // Transcribe audio with OpenAI Whisper API
  const transcribeWithWhisper = async () => {
    if (audioChunksRef.current.length === 0) {
      console.log("No audio to transcribe");
      return;
    }

    try {
      // Create audio blob from chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");

      // Send to backend Whisper endpoint
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Transcription failed");

      const data = await response.json();
      const transcript = data.text?.trim();

      if (transcript) {
        console.log("📢 Transcribed:", transcript);
        handleSendMessage(transcript);
      }

      audioChunksRef.current = [];
      
      // Restart listening
      if (mediaRecorderRef.current && initRef.current) {
        startVoiceActivityDetection(mediaRecorderRef.current);
      }
    } catch (error) {
      console.error("Whisper transcription error:", error);
      toast({
        title: "Transcription Error",
        description: "Failed to transcribe audio",
        variant: "destructive",
      });
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

  // Clean text for speech (remove all markdown, special characters)
  const cleanTextForSpeech = (text: string): string => {
    return text
      .replace(/LEARNORY/g, "Learnory")
      .replace(/\*\*(.+?)\*\*/g, "$1")  // Remove bold markers, keep text
      .replace(/\*(.+?)\*/g, "$1")      // Remove italic markers
      .replace(/`(.+?)`/g, "$1")        // Remove code markers
      .replace(/#{1,6}\s+/g, "")        // Remove headers
      .replace(/[-•*]\s+/g, ". ")       // Convert bullet points to periods
      .replace(/\n\n+/g, ". ")          // Replace multiple newlines with periods
      .replace(/\n/g, " ")              // Replace newlines with spaces
      .replace(/\[(.+?)\]\(.+?\)/g, "$1") // Remove links, keep text
      .trim();
  };

  // Play audio with mouth animation (clean text, no markdown symbols)
  const playAudio = async (text: string) => {
    setIsSpeaking(true);
    mouthAnimationRef.current = true;

    try {
      const cleanText = cleanTextForSpeech(text);
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = voice === "female" ? 1.2 : 0.8;
      utterance.volume = 0.7;
      
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
    
    // INTERRUPT: Stop any current speech synthesis immediately
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    mouthAnimationRef.current = false;

    try {
      addMessage("user", text);

      // SAVE TO CHAT HISTORY: Use sessionId if available
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: text, 
          sessionId: sessionId, // Save to database with session
          includeUserContext: true,
          autoLearn: true // Enable auto-learning from this message
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      console.log("API Response:", data);
      let aiMessage = data.message || "Got it!";
      console.log("AI Message to display:", aiMessage);
      
      // Clean up display text
      aiMessage = aiMessage
        .replace(/LEARNORY/g, "Learnory")
        .trim();
      
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
      // Resume listening after message is processed
      if (recognitionRef.current && initRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Recognition may already be running
          console.log("Voice recognition already active");
        }
      }
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
