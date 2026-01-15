import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Volume2, VolumeX, Upload, X, Mic, MicOff, Phone, PhoneOff, Settings, Shield, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChatInterface } from "@/components/live-ai/ChatInterface";
import { QuickActions } from "@/components/live-ai/QuickActions";
import { AvatarDisplay } from "@/components/live-ai/AvatarDisplay";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const GEMINI_VOICES = [
  { id: "Aoede", name: "Aoede", description: "Bright & melodic" },
  { id: "Charon", name: "Charon", description: "Deep & authoritative" },
  { id: "Fenrir", name: "Fenrir", description: "Strong & commanding" },
  { id: "Kore", name: "Kore", description: "Warm & nurturing" },
  { id: "Puck", name: "Puck", description: "Playful & energetic" },
];

export default function LiveAI() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [voice] = useState<"female" | "male">("female");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentMode, setCurrentMode] = useState("explain");
  const [messageInput, setMessageInput] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [whisperStatus, setWhisperStatus] = useState<"online" | "offline">("online");
  const [usingBrowserAPI, setUsingBrowserAPI] = useState(false);
  const [showUploadMode, setShowUploadMode] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [fileDescription, setFileDescription] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [isCallActive, setIsCallActive] = useState(true);
  const [, setLocation] = useLocation();
  
  // Microphone permission and settings states
  const [micPermission, setMicPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  const [showMicSettings, setShowMicSettings] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("Aoede");
  const [isGeminiConnected, setIsGeminiConnected] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messageCountRef = useRef(0);
  const initRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mouthAnimationRef = useRef<boolean>(false);
  const sessionIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const geminiWsRef = useRef<WebSocket | null>(null);

  // Check microphone permission on mount
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
      setMicPermission(result.state as "granted" | "denied" | "prompt");
      
      result.addEventListener("change", () => {
        setMicPermission(result.state as "granted" | "denied" | "prompt");
      });
    } catch (error) {
      console.log("Permission API not supported, will check on use");
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission("granted");
      toast({
        title: "Microphone Access Granted",
        description: "You can now use voice features",
      });
      return true;
    } catch (error) {
      setMicPermission("denied");
      toast({
        title: "Microphone Access Denied",
        description: "Please enable microphone in browser settings",
        variant: "destructive",
      });
      return false;
    }
  };

  // Connect to Gemini Live WebSocket
  const connectToGeminiLive = () => {
    if (geminiWsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/gemini-live?userId=${user?.id || 'anonymous'}`;
    
    const ws = new WebSocket(wsUrl);
    geminiWsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to Gemini Live API");
      setIsGeminiConnected(true);
      toast({
        title: "AI Voice Connected",
        description: "Ready for real-time conversation",
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleGeminiMessage(data);
      } catch (error) {
        console.error("Error parsing Gemini message:", error);
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from Gemini Live API");
      setIsGeminiConnected(false);
    };

    ws.onerror = (error) => {
      console.error("Gemini WebSocket error:", error);
      setIsGeminiConnected(false);
    };
  };

  const handleGeminiMessage = (data: any) => {
    switch (data.type) {
      case "session_started":
        console.log("Gemini session started:", data.sessionId);
        break;
      case "processing_started":
        setIsProcessing(true);
        break;
      case "processing_complete":
        setIsProcessing(false);
        break;
      case "ai_response":
        addMessage("assistant", data.text);
        speakText(data.text);
        break;
      case "error":
        toast({
          title: "AI Error",
          description: data.message,
          variant: "destructive",
        });
        setIsProcessing(false);
        break;
    }
  };

  const sendAudioToGemini = async (audioBase64: string) => {
    if (geminiWsRef.current?.readyState !== WebSocket.OPEN) {
      connectToGeminiLive();
      setTimeout(() => sendAudioToGemini(audioBase64), 500);
      return;
    }

    geminiWsRef.current.send(JSON.stringify({
      type: "audio_input",
      audio: audioBase64,
    }));
  };

  const sendTextToGemini = (text: string) => {
    if (geminiWsRef.current?.readyState !== WebSocket.OPEN) {
      connectToGeminiLive();
      setTimeout(() => sendTextToGemini(text), 500);
      return;
    }

    geminiWsRef.current.send(JSON.stringify({
      type: "text_input",
      text,
    }));
  };

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
          console.log("🔄 Creating chat session...");
          const response = await fetch("/api/chat/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              title: "Live AI Session - " + new Date().toLocaleString(),
              mode: "live-ai",
              summary: "Interactive voice-based learning session"
            })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const session = await response.json();
          console.log("📊 Session response:", session);
          
          if (session.id) {
            setSessionId(session.id);
            sessionIdRef.current = session.id;
            console.log("✓ Created chat session:", session.id);
          } else {
            console.error("❌ No session ID in response:", session);
          }
        } catch (err) {
          console.error("❌ Failed to create session:", err);
        }
      })();

      // Use Browser Speech Recognition API for voice input
      // This will be used when user clicks "Unmute to Talk"
      setUsingBrowserAPI(true);
      console.log("✅ Browser Speech Recognition available - waiting for user to unmute");
      
      // Auto-greet with proper persistence and audio playback
      setTimeout(async () => {
        const greetings = [
          "Hello! I'm your LEARNORY AI tutor. What would you like to learn today?",
          "Hi! I'm here to help you study. What topic interests you?",
          "Welcome to LEARNORY! I'm ready to assist with your learning.",
        ];
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        
        // Add to UI immediately
        addMessage("assistant", greeting);
        
        // Save to database for permanent transcript (wait for sessionId if needed)
        const checkAndSave = async () => {
          let attempts = 0;
          while (!sessionId && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
          if (sessionId) {
            await saveMessageToDatabase("assistant", greeting);
          }
        };
        checkAndSave();
        
        // Speak the greeting (but DON'T auto-unmute - wait for user to click unmute button)
        console.log("🎙️ Playing greeting...");
        await playAudioGreeting(greeting);
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
      // Request microphone permission with MAXIMUM sensitivity and clarity
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // Disable to hear all frequencies
          autoGainControl: true, // Enable to boost quiet voices
        } as any
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
        if (mediaRecorder.state === "inactive") {
          mediaRecorder.start();
        }
        setIsListening(true);
        console.log("🎤 Recording started");
        
        if (silenceTimer) clearTimeout(silenceTimer);
      } else if (!hasVoice && isRecording) {
        // Start silence timer
        if (!silenceTimer) {
          silenceTimer = setTimeout(() => {
            // End recording after silence threshold
            isRecording = false;
            if (mediaRecorder.state === "recording") {
              mediaRecorder.stop();
            }
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

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Transcription failed");
      }

      const data = await response.json();
      const transcript = data.text?.trim();

      // Check if transcript is an error message from the backend (Whisper quota exceeded)
      const isErrorMessage = transcript && (
        transcript.includes("Transcription unavailable") || 
        transcript.includes("quota exceeded") ||
        transcript.includes("OpenAI") ||
        transcript.startsWith("[")
      );

      if (isErrorMessage) {
        // Treat quota/error messages as failed transcription - fallback to Browser API
        console.warn("⚠️ Whisper error message received - Switching to Browser Speech API");
        setWhisperStatus("offline");
        setUsingBrowserAPI(true);
        
        // Show user notification
        toast({
          title: "🎤 Switched to Browser Voice",
          description: "Using backup voice recognition - please speak again",
          variant: "default",
        });

        // Automatically start Browser Speech Recognition as fallback
        startBrowserSpeechRecognition();
        audioChunksRef.current = [];
        return;
      }

      if (transcript) {
        console.log("✓ Whisper: Transcribed", transcript);
        handleSendMessage(transcript);
      }

      audioChunksRef.current = [];
      
      // Restart listening - ensure media recorder is ready
      if (mediaRecorderRef.current && initRef.current && mediaRecorderRef.current.state === "inactive") {
        startVoiceActivityDetection(mediaRecorderRef.current);
      }
    } catch (error: any) {
      console.error("Whisper transcription error:", error);
      console.warn("⚠️ OpenAI Whisper failed - Switching to Browser Speech API");
      
      // Switch to Browser Speech Recognition on ANY Whisper error
      setWhisperStatus("offline");
      setUsingBrowserAPI(true);
      
      // Show user notification
      toast({
        title: "🎤 Switched to Browser Voice",
        description: "Using backup voice recognition - please speak again",
        variant: "default",
      });

      // Automatically start Browser Speech Recognition as fallback
      startBrowserSpeechRecognition();
    }
  };

  // Fallback to Browser Speech Recognition API - SIMPLE & CLEAN
  const startBrowserSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Please type your question",
        variant: "destructive",
      });
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Already stopped
      }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after detecting speech
    recognition.interimResults = false; // Don't send interim results
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("🎤 Listening - Please speak now...");
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      // Skip if muted
      if (isMuted || isProcessing) {
        return;
      }

      // Collect ONLY new FINAL results
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript.trim();
          if (transcript) {
            finalTranscript += (finalTranscript ? " " : "") + transcript;
          }
        }
      }

      if (finalTranscript) {
        console.log("✅ RECOGNIZED:", finalTranscript);
        
        // Interrupt current speech if speaking
        if (isSpeaking) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
          mouthAnimationRef.current = false;
        }
        
        // Send immediately
        handleSendMessage(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("🎤 Speech error:", event.error);
      }
    };

    recognition.onend = () => {
      console.log("🎤 Listening stopped");
      setIsListening(false);
      
      // Auto-restart ONLY if user not muted and call is active
      if (usingBrowserAPI && initRef.current && !isMuted && isCallActive && !isProcessing) {
        try {
          console.log("🔄 Restarting listener...");
          recognition.start();
        } catch (e) {
          console.warn("Could not restart:", e);
        }
      }
    };

    try {
      recognition.start();
      console.log("✅ Speech Recognition STARTED");
    } catch (e) {
      console.warn("Speech already started:", e);
    }
    recognitionRef.current = recognition;
  };


  // Save message to both UI and database for permanent transcript
  const addMessage = (role: "user" | "assistant", content: string) => {
    const msg: Message = {
      id: `${role}-${++messageCountRef.current}`,
      role,
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
  };

  // Save assistant message to database for permanent transcript
  const saveMessageToDatabase = async (role: "user" | "assistant", content: string) => {
    try {
      // Use ref first, then state
      let currentSessionId = sessionIdRef.current || sessionId;
      
      // Wait a bit for session to be created if not available yet
      if (!currentSessionId) {
        let attempts = 0;
        while (!currentSessionId && attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 100));
          currentSessionId = sessionIdRef.current || sessionId;
          attempts++;
        }
      }

      if (!currentSessionId) {
        console.warn("No session ID - message not persisted to database");
        return;
      }

      await fetch("/api/chat/save-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId: currentSessionId,
          role,
          content,
          timestamp: new Date().toISOString(),
        }),
      });
      console.log(`✓ Message saved to database: ${role}`);
    } catch (error) {
      console.error("Failed to save message to database:", error);
    }
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

  // Play greeting audio (don't auto-unmute after - wait for user to click unmute)
  const playAudioGreeting = async (text: string) => {
    setIsSpeaking(true);
    mouthAnimationRef.current = true;
    setIsMuted(true); // Keep muted during greeting

    try {
      const cleanText = cleanTextForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = voice === "female" ? 1.2 : 0.8;
      utterance.volume = 0.7;
      
      utterance.onend = () => {
        setIsSpeaking(false);
        mouthAnimationRef.current = false;
        // Stay muted - user must click "Unmute to Talk" to start listening
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

  // Play audio with mouth animation (clean text, no markdown symbols)
  // Called for AI responses AFTER user has sent a message
  const playAudio = async (text: string) => {
    setIsSpeaking(true);
    mouthAnimationRef.current = true;
    
    // AUTO-MUTE: Mute mic while AI is speaking to prevent it from hearing itself
    setIsMuted(true);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      console.log("🔇 Auto-muted: Stopping speech recognition while AI speaks");
    }

    try {
      const cleanText = cleanTextForSpeech(text);
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = voice === "female" ? 1.2 : 0.8;
      utterance.volume = 0.7;
      
      utterance.onend = () => {
        setIsSpeaking(false);
        mouthAnimationRef.current = false;
        
        // AUTO-UNMUTE: Unmute mic when AI finishes speaking (now ready for next question)
        setIsMuted(false);
        if (usingBrowserAPI && initRef.current && isCallActive) {
          console.log("🔊 Auto-unmuted: Ready for next question - call startBrowserSpeechRecognition");
          startBrowserSpeechRecognition();
        }
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
        mouthAnimationRef.current = false;
        
        // AUTO-UNMUTE on error too
        setIsMuted(false);
        if (usingBrowserAPI && initRef.current && isCallActive) {
          startBrowserSpeechRecognition();
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech synthesis error:", e);
      setIsSpeaking(false);
      mouthAnimationRef.current = false;
      
      // AUTO-UNMUTE on error
      setIsMuted(false);
      if (usingBrowserAPI && initRef.current && isCallActive) {
        startBrowserSpeechRecognition();
      }
    }
  };

  // Speak text using TTS (wrapper for playAudio used by Gemini Live)
  const speakText = (text: string) => {
    playAudio(text);
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
      
      // Save user message to database for permanent transcript
      await saveMessageToDatabase("user", text);

      // If Whisper is offline and user types, auto-recover when they message
      if (!usingBrowserAPI && whisperStatus === "offline") {
        console.log("🔄 Attempting to re-enable Whisper API...");
        setWhisperStatus("online");
        setUsingBrowserAPI(false);
        localStorage.setItem("learnory_whisper_status", "online");
        
        toast({
          title: "✓ Voice Restored",
          description: "You can now talk to me again!",
        });

        // Send notification
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "system",
            title: "Voice Transcription Restored",
            message: "OpenAI Whisper API is now available. You can use voice again!",
            icon: "✓",
          })
        }).catch(err => console.error("Failed to create notification:", err));
      }

      // SAVE TO CHAT HISTORY: Use sessionId if available
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
      
      // Save AI message to database for permanent transcript
      await saveMessageToDatabase("assistant", aiMessage);

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

  // Save settings and Whisper status
  useEffect(() => {
    localStorage.setItem(
      "learnory_live_ai_settings",
      JSON.stringify({ isDarkMode })
    );
    localStorage.setItem("learnory_whisper_status", whisperStatus);
  }, [isDarkMode, whisperStatus]);

  // Save messages
  useEffect(() => {
    localStorage.setItem("learnory_chat_messages", JSON.stringify(messages));
  }, [messages]);

  // End call - stop microphone and redirect to chat page
  const handleEndCall = () => {
    console.log("📞 Ending call...");
    
    // Stop speech synthesis
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    mouthAnimationRef.current = false;
    
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Close media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    
    setIsCallActive(false);
    setIsListening(false);
    setIsMuted(true);
    
    toast({
      title: "📞 Call Ended",
      description: "Microphone disabled. Your conversation has been saved.",
    });
    
    // Redirect to chat page after a short delay
    setTimeout(() => {
      setLocation("/");
    }, 1000);
  };

  // Handle file selection - just set file and show prompt input
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setShowPromptInput(true);
    setFileDescription("");
    
    toast({
      title: "📁 File Selected",
      description: `${file.name} loaded. Now describe what you need help with.`,
    });
  };

  // Handle submission of file + description to LEARNORY API
  const handleAnalyzeWithDescription = async () => {
    if (!uploadedFile || !fileDescription.trim()) {
      toast({
        title: "⚠️ Missing Information",
        description: "Please describe what you need help with.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("description", fileDescription);
      
      toast({
        title: "🔍 Analyzing with LEARNORY...",
        description: `Processing ${uploadedFile.name}...`,
      });

      const response = await fetch("/api/chat/analyze-file", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze file");
      }

      const data = await response.json();
      const analysis = data.analysis || "File analyzed successfully";

      // Add user message showing uploaded file + description
      const fileName = uploadedFile.name;
      addMessage("user", `📎 ${fileName}\n\n${fileDescription}`);
      await saveMessageToDatabase("user", `File: ${fileName}\nRequest: ${fileDescription}`);

      // Add AI analysis response
      let displayResponse = analysis;
      if (typeof analysis === "object") {
        displayResponse = JSON.stringify(analysis, null, 2);
      }

      addMessage("assistant", displayResponse);
      await saveMessageToDatabase("assistant", displayResponse);

      // Speak the response
      await playAudio(displayResponse);

      toast({
        title: "✅ LEARNORY Analysis Complete",
        description: "Response generated and read aloud",
      });

      // Reset upload mode
      setShowUploadMode(false);
      setShowPromptInput(false);
      setUploadedFile(null);
      setFileDescription("");
      setUploadProgress(0);
      
    } catch (error) {
      console.error("File analysis error:", error);
      toast({
        title: "Error",
        description: "Failed to analyze file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

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
                {isMuted && !isProcessing && !isSpeaking && "🔇 Muted - Click Unmute to talk"}
                {isListening && !isMuted && "🎤 Listening..."}
                {isSpeaking && "🔊 LEARNORY Speaking..."}
                {isProcessing && "⏳ Thinking..."}
              </div>

              {/* Action Buttons */}
              <div className="w-full max-w-sm">
                <QuickActions 
                  onModeSelect={(mode, prompt = "") => {
                    setCurrentMode(mode);
                    // Handle special modes
                    if (mode === "ask-question") {
                      // Focus on input for direct questioning
                      const textarea = document.querySelector('[data-testid="textarea-message"]') as HTMLTextAreaElement;
                      textarea?.focus();
                    } else if (mode === "voice-tutor") {
                      // Activate voice mode
                      setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: "assistant",
                        content: "Voice mode activated! I'm ready to have a voice conversation with you. Speak naturally!",
                        timestamp: Date.now()
                      }]);
                      toast({ title: "🎤 Voice Mode", description: "Start speaking to begin conversation" });
                    } else if (mode === "scan-image" || mode === "summarize") {
                      // Show file upload interface
                      setShowUploadMode(true);
                      setUploadedFile(null);
                      toast({ title: "📁 " + (mode === "scan-image" ? "Upload Image" : "Upload PDF"), description: "Click the upload button to choose your file" });
                      setTimeout(() => fileInputRef.current?.click(), 100);
                    } else {
                      // For other modes, pre-fill the message input
                      setMessageInput(prompt);
                      // Auto-focus to prompt user to complete the thought
                      setTimeout(() => {
                        const textarea = document.querySelector('[data-testid="textarea-message"]') as HTMLTextAreaElement;
                        textarea?.focus();
                      }, 100);
                    }
                  }}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Control Buttons - Mute/Unmute and End Call */}
              <div className="w-full max-w-sm flex gap-2">
                <Button
                  onClick={() => {
                    if (isMuted) {
                      // User wants to unmute and start listening
                      setIsMuted(false);
                      console.log("🎤 User clicked Unmute - Starting speech recognition...");
                      console.log("usingBrowserAPI:", usingBrowserAPI, "isCallActive:", isCallActive);
                      if (usingBrowserAPI && isCallActive) {
                        startBrowserSpeechRecognition();
                      } else {
                        console.warn("⚠️ Cannot start: usingBrowserAPI=", usingBrowserAPI, "isCallActive=", isCallActive);
                      }
                      toast({ title: "🎤 Unmuted", description: "Microphone is now active - speak whenever you're ready" });
                    } else {
                      // User wants to mute
                      setIsMuted(true);
                      if (recognitionRef.current) {
                        try {
                          recognitionRef.current.stop();
                        } catch (e) {
                          // Already stopped
                        }
                      }
                      toast({ title: "🔇 Muted", description: "Microphone is now off" });
                    }
                  }}
                  variant={isMuted ? "default" : "outline"}
                  size="sm"
                  className="flex-1 gap-2"
                  data-testid="button-toggle-mute"
                  title={isMuted ? "Click to unmute and start talking" : "Click to mute microphone"}
                >
                  {isMuted ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      Unmute to Talk
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Mute
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleEndCall}
                  variant="destructive"
                  size="sm"
                  className="flex-1 gap-2"
                  data-testid="button-end-call"
                  title="End the call and stop microphone"
                >
                  <PhoneOff className="w-4 h-4" />
                  End Call
                </Button>
              </div>

              {/* Voice Settings Button */}
              <Button
                onClick={() => setShowMicSettings(!showMicSettings)}
                variant="outline"
                size="sm"
                className="w-full max-w-sm gap-2"
                data-testid="button-voice-settings"
              >
                <Settings className="w-4 h-4" />
                Voice & Microphone Settings
              </Button>

              {/* Microphone Settings Panel */}
              {showMicSettings && (
                <Card className={`w-full max-w-sm p-4 ${isDarkMode ? "bg-slate-800 border-slate-700" : ""}`}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Voice Settings</h3>
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Sparkles className="w-3 h-3" />
                        Gemini 2.0
                      </Badge>
                    </div>

                    {/* Microphone Permission */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Shield className="w-4 h-4" />
                        Microphone Permission
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {micPermission === "granted" && "Access granted"}
                          {micPermission === "denied" && "Access denied"}
                          {micPermission === "prompt" && "Not requested yet"}
                        </span>
                        {micPermission !== "granted" && (
                          <Button
                            size="sm"
                            onClick={requestMicrophonePermission}
                            data-testid="button-request-mic"
                          >
                            Grant Access
                          </Button>
                        )}
                        {micPermission === "granted" && (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                            Enabled
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* AI Voice Selection */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">AI Voice</div>
                      <div className="grid grid-cols-2 gap-2">
                        {GEMINI_VOICES.map((v) => (
                          <Button
                            key={v.id}
                            variant={selectedVoice === v.id ? "default" : "outline"}
                            size="sm"
                            className="justify-start text-left"
                            onClick={() => {
                              setSelectedVoice(v.id);
                              if (geminiWsRef.current?.readyState === WebSocket.OPEN) {
                                geminiWsRef.current.send(JSON.stringify({
                                  type: "set_voice",
                                  voice: v.id,
                                }));
                              }
                            }}
                            data-testid={`button-voice-${v.id}`}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{v.name}</span>
                              <span className="text-xs opacity-70">{v.description}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Connection Status */}
                    <div className="flex items-center justify-between text-sm">
                      <span>Gemini Live API</span>
                      <Badge variant={isGeminiConnected ? "secondary" : "outline"}>
                        {isGeminiConnected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>

                    {!isGeminiConnected && (
                      <Button
                        size="sm"
                        onClick={connectToGeminiLive}
                        className="w-full"
                        data-testid="button-connect-gemini"
                      >
                        Connect to AI Voice
                      </Button>
                    )}
                  </div>
                </Card>
              )}

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

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              accept={currentMode === "scan-image" ? "image/*" : ".pdf,.doc,.docx,.txt"}
              style={{ display: "none" }}
              data-testid="input-file-upload"
            />

            {/* File Upload Interface - Shows when upload mode is active */}
            {showUploadMode && !showPromptInput && (
              <Card className={`p-6 border-2 border-dashed ${isDarkMode ? "bg-slate-800/50 border-purple-500/50" : "bg-purple-50 border-purple-300"}`}>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      {currentMode === "scan-image" ? "📷 Upload Image or Problem" : "📄 Upload PDF or Notes"}
                    </p>
                    <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                      {uploadedFile ? uploadedFile.name : "Click to upload or drag and drop"}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="flex-1 gap-2"
                      data-testid="button-upload-file"
                    >
                      <Upload className="w-4 h-4" />
                      {uploadedFile ? "Change File" : "Choose File"}
                    </Button>

                    {uploadedFile && (
                      <Button
                        onClick={() => {
                          setUploadedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        variant="outline"
                        size="icon"
                        disabled={isProcessing}
                        data-testid="button-remove-file"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}

                    <Button
                      onClick={() => {
                        setShowUploadMode(false);
                        setShowPromptInput(false);
                        setUploadedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      variant="outline"
                      disabled={isProcessing}
                      data-testid="button-cancel-upload"
                    >
                      Cancel
                    </Button>
                  </div>

                  {uploadedFile && !isProcessing && (
                    <div className={`text-xs p-3 rounded ${isDarkMode ? "bg-slate-700" : "bg-white"}`}>
                      <p className={isDarkMode ? "text-slate-300" : "text-slate-700"}>
                        ✓ Ready: <strong>{uploadedFile.name}</strong>
                      </p>
                    </div>
                  )}

                  {isProcessing && (
                    <div className={`text-xs p-3 rounded animate-pulse ${isDarkMode ? "bg-slate-700" : "bg-white"}`}>
                      <p className={isDarkMode ? "text-slate-300" : "text-slate-700"}>
                        ⏳ Analyzing with LEARNORY...
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Prompt Input - Shows after file is selected */}
            {showPromptInput && uploadedFile && (
              <Card className={`p-6 border-2 ${isDarkMode ? "bg-slate-800/50 border-purple-500/30" : "bg-purple-50 border-purple-200"}`}>
                <div className="space-y-4">
                  <div>
                    <p className={`text-sm font-medium mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      📎 File: <span className="text-purple-600 dark:text-purple-400">{uploadedFile.name}</span>
                    </p>
                    <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                      Now describe what you need help with. This helps LEARNORY give you better responses.
                    </p>
                  </div>

                  <Textarea
                    placeholder={
                      currentMode === "scan-image" 
                        ? "e.g., Solve this math problem step by step, explain the physics concept, or find the errors in this code..."
                        : "e.g., Summarize the key points, extract formulas, find important concepts, or create a study guide..."
                    }
                    value={fileDescription}
                    onChange={(e) => setFileDescription(e.target.value)}
                    rows={4}
                    className="resize-none"
                    disabled={isProcessing}
                    data-testid="textarea-file-description"
                  />

                  <div className="flex gap-3">
                    <Button
                      onClick={handleAnalyzeWithDescription}
                      disabled={!fileDescription.trim() || isProcessing}
                      className="flex-1 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      data-testid="button-analyze-with-description"
                    >
                      <Send className="w-4 h-4" />
                      {isProcessing ? "Analyzing..." : "Analyze with LEARNORY"}
                    </Button>

                    <Button
                      onClick={() => {
                        setShowPromptInput(false);
                        setFileDescription("");
                      }}
                      variant="outline"
                      disabled={isProcessing}
                      data-testid="button-back-to-upload"
                    >
                      Back
                    </Button>
                  </div>

                  {isProcessing && (
                    <div className={`text-xs p-3 rounded animate-pulse ${isDarkMode ? "bg-slate-700" : "bg-white"}`}>
                      <p className={isDarkMode ? "text-slate-300" : "text-slate-700"}>
                        🔍 LEARNORY is analyzing your file and request...
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Type Message Input - Simple */}
            {!showUploadMode && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
