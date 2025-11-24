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
  onModeSelect: (mode: string) => void;
}

const modes = [
  { id: "explain", label: "Explain My Homework", icon: BookOpen },
  { id: "past-questions", label: "Solve Past Questions", icon: HelpCircle },
  { id: "scan-image", label: "Scan & Solve Image", icon: FileText },
  { id: "summarize", label: "Summarize PDF / Notes", icon: BarChart3 },
  { id: "voice-tutor", label: "Voice Tutor Mode", icon: Mic },
  { id: "study-plan", label: "Study Planner Creator", icon: Calendar },
  { id: "mock-exam", label: "Mock Exam Test Mode", icon: ClipboardList },
  { id: "lesson-replay", label: "Lesson Replay", icon: Video },
  { id: "topic-breakdown", label: "Topic Breakdown", icon: Layers },
  { id: "ask-question", label: "Ask Any Question", icon: MessageCircle },
];

export function QuickActions({ onModeSelect }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      {modes.map((mode) => {
        const Icon = mode.icon;
        return (
          <Button
            key={mode.id}
            variant="outline"
            size="sm"
            onClick={() => onModeSelect(mode.id)}
            data-testid={`button-mode-${mode.id}`}
            className="flex flex-col items-center gap-1 h-auto py-2 text-xs"
          >
            <Icon className="w-4 h-4" />
            <span className="text-center leading-tight">{mode.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
