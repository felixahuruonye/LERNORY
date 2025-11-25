import { Button } from "@/components/ui/button";
import {
  BookOpen,
  HelpCircle,
  FileText,
  BarChart3,
  Mic,
  Calendar,
  ClipboardList,
  Video,
  Layers,
  MessageCircle,
} from "lucide-react";

interface QuickActionsProps {
  onModeSelect: (mode: string, prompt?: string) => void;
  isDarkMode?: boolean;
}

const modes = [
  { id: "explain", label: "Explain My Homework", icon: BookOpen, prompt: "Please help me understand my homework. Here's what I'm working on:\n\n" },
  { id: "past-questions", label: "Solve Past Questions", icon: HelpCircle, prompt: "I have some past exam questions I'd like help solving:\n\n" },
  { id: "scan-image", label: "Scan & Solve Image", icon: FileText, prompt: "Can you help me solve this image/problem? Let me upload it...\n\n" },
  { id: "summarize", label: "Summarize PDF / Notes", icon: BarChart3, prompt: "Can you help summarize my notes or PDF? Let me upload it...\n\n" },
  { id: "voice-tutor", label: "Voice Tutor Mode", icon: Mic, prompt: "I'd like to have a voice conversation with you about my studies. " },
  { id: "study-plan", label: "Study Planner Creator", icon: Calendar, prompt: "I need help creating a study plan. Here's my situation:\n\nExam: \nAvailable time: \nSubjects to cover: \nCurrent level: " },
  { id: "mock-exam", label: "Mock Exam Test Mode", icon: ClipboardList, prompt: "Let's start a mock exam. Subject: " },
  { id: "lesson-replay", label: "Lesson Replay", icon: Video, prompt: "Can you replay the key concepts from a topic I studied? Topic: " },
  { id: "topic-breakdown", label: "Topic Breakdown", icon: Layers, prompt: "I'd like a detailed breakdown of this topic:\n\n" },
  { id: "ask-question", label: "Ask Any Question", icon: MessageCircle, prompt: "" },
];

export function QuickActions({ onModeSelect, isDarkMode = false }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      {modes.map((mode) => {
        const Icon = mode.icon;
        return (
          <Button
            key={mode.id}
            onClick={() => onModeSelect(mode.id, mode.prompt)}
            data-testid={`button-mode-${mode.id}`}
            className={`flex flex-col items-center gap-1 h-auto py-3 px-2 text-xs rounded-lg font-medium transition-all duration-200 hover-elevate
              ${isDarkMode 
                ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white border border-purple-400/50 hover:border-purple-300' 
                : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white border border-purple-600 hover:border-purple-700'
              }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-center leading-tight">{mode.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
