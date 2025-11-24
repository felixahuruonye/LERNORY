import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Mic,
  MicOff,
  Upload,
  Send,
  Loader,
  Zap,
  BookOpen,
  Calendar,
  Search,
  Settings,
  FileText,
  Brain,
  BarChart3,
  MessageCircle,
  Download,
  Plus,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function LiveAI() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [inputText, setInputText] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [selectedMode, setSelectedMode] = useState("conversational");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const modes = [
    { id: "conversational", label: "Conversational", icon: MessageCircle },
    { id: "teaching", label: "Teaching Mode", icon: BookOpen },
    { id: "exam", label: "Exam Mode", icon: BarChart3 },
  ];

  const features = [
    { id: "live_talk", label: "Live AI Talk", icon: Mic, desc: "Real-time voice conversation" },
    { id: "upload", label: "Upload Document", icon: Upload, desc: "PDF, images, notes" },
    { id: "exam", label: "Exam Practice", icon: BarChart3, desc: "Mock exams & tests" },
    { id: "timetable", label: "Create Timetable", icon: Calendar, desc: "Study schedule" },
    { id: "lesson", label: "Lesson Explainer", icon: BookOpen, desc: "Topic deep-dive" },
    { id: "university", label: "University Finder", icon: Search, desc: "Course advisor" },
    { id: "notes", label: "AI Notes Maker", icon: FileText, desc: "Auto-generate notes" },
    { id: "brain", label: "Study Memory", icon: Brain, desc: "Learning tracker" },
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        handleAudioSubmit(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({ title: "Recording started", description: "Speak now..." });
    } catch (error) {
      toast({ title: "Error", description: "Could not access microphone", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioSubmit = async (audioBlob: Blob) => {
    console.log("Audio submitted:", audioBlob.size, "bytes");
    // TODO: Send to Vapi API or backend for processing
    toast({ title: "Processing audio", description: "Converting speech to text..." });
  };

  const handleTextSubmit = async () => {
    if (!inputText.trim()) return;

    setMessages([...messages, { role: "user", content: inputText }]);
    setInputText("");

    // TODO: Send to LEARNORY AI system
    toast({ title: "Sending to LEARNORY AI...", description: "Processing your message" });

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I received your message in ${selectedMode} mode. How can I help you learn today?`,
        },
      ]);
    }, 1000);
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDoc = {
      id: Math.random().toString(),
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date(),
    };

    setUploadedDocs([...uploadedDocs, newDoc]);
    toast({ title: "Document uploaded", description: `${file.name} is being analyzed...` });

    // TODO: Send to backend for AI analysis
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-b border-purple-500/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              LEARNORY LIVE AI
            </h1>
          </div>
          <div className="flex gap-2">
            <Link href="/chat">
              <Button variant="outline" size="sm" className="gap-2">
                <MessageCircle className="w-4 h-4" /> Back to Chat
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mode Selector */}
          <Card className="p-4 bg-slate-800/50 border-slate-700 backdrop-blur">
            <div className="flex gap-2 flex-wrap">
              {modes.map((mode) => (
                <Button
                  key={mode.id}
                  variant={selectedMode === mode.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMode(mode.id)}
                  className="gap-2"
                  data-testid={`button-mode-${mode.id}`}
                >
                  <mode.icon className="w-4 h-4" />
                  {mode.label}
                </Button>
              ))}
            </div>
          </Card>

          {/* Messages Area */}
          <Card className="h-96 bg-slate-800/50 border-slate-700 p-4 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <Zap className="w-12 h-12 text-purple-400/30 mx-auto mb-3" />
                  <p className="text-slate-400">Start a conversation or upload a document...</p>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-700 text-slate-100"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
          </Card>

          {/* Input Area */}
          <Card className="p-4 bg-slate-800/50 border-slate-700 space-y-3">
            <div className="flex gap-2">
              <Button
                variant={isRecording ? "destructive" : "default"}
                onClick={isRecording ? stopRecording : startRecording}
                className="gap-2"
                data-testid="button-voice"
              >
                {isRecording ? (
                  <> <MicOff className="w-4 h-4" /> Stop </> 
                ) : (
                  <> <Mic className="w-4 h-4" /> Speak </>
                )}
              </Button>
              <label className="flex-1">
                <input type="file" hidden onChange={handleDocumentUpload} accept=".pdf,.jpg,.png,.docx" />
                <Button variant="outline" className="w-full gap-2" asChild>
                  <span>
                    <Upload className="w-4 h-4" /> Upload File
                  </span>
                </Button>
              </label>
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask LEARNORY anything... or upload a document"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleTextSubmit()}
                className="resize-none border-slate-700"
                data-testid="input-message"
              />
              <Button onClick={handleTextSubmit} size="icon" data-testid="button-send">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Features Sidebar */}
        <div className="space-y-6">
          {/* Quick Features */}
          <Card className="p-4 bg-slate-800/50 border-slate-700 backdrop-blur">
            <h2 className="font-bold text-lg mb-3 text-white">AI Features</h2>
            <div className="grid grid-cols-2 gap-2">
              {features.map((feature) => (
                <Button
                  key={feature.id}
                  variant="outline"
                  size="sm"
                  className="flex flex-col items-center justify-center h-auto py-2 gap-1 text-xs"
                  onClick={() => toast({ title: feature.label, description: feature.desc })}
                  data-testid={`button-feature-${feature.id}`}
                >
                  <feature.icon className="w-4 h-4" />
                  <span className="line-clamp-2">{feature.label}</span>
                </Button>
              ))}
            </div>
          </Card>

          {/* Uploaded Documents */}
          {uploadedDocs.length > 0 && (
            <Card className="p-4 bg-slate-800/50 border-slate-700 backdrop-blur">
              <h2 className="font-bold text-lg mb-3 text-white flex items-center gap-2">
                <FileText className="w-4 h-4" /> Documents
              </h2>
              <div className="space-y-2">
                {uploadedDocs.map((doc) => (
                  <div key={doc.id} className="p-2 bg-slate-700/50 rounded text-sm flex items-center justify-between">
                    <span className="truncate">{doc.name}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* AI Status */}
          <Card className="p-4 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/50 backdrop-blur">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-slate-300">AI Status: Ready</span>
            </div>
            <p className="text-xs text-slate-400">Vapi AI Connected • Document Processing Active</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
