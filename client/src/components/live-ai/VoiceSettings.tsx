import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";

interface VoiceSettingsProps {
  onClose: () => void;
  voice: string;
  speed: number;
  language: string;
  tone: string;
  onVoiceChange: (voice: string) => void;
  onSpeedChange: (speed: number) => void;
  onLanguageChange: (language: string) => void;
  onToneChange: (tone: string) => void;
}

export function VoiceSettings({
  onClose,
  voice,
  speed,
  language,
  tone,
  onVoiceChange,
  onSpeedChange,
  onLanguageChange,
  onToneChange,
}: VoiceSettingsProps) {
  return (
    <Card className="p-4 bg-slate-800 border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white">Voice Settings</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          data-testid="button-close-settings"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Voice Selection */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-2">
            AI Voice
          </label>
          <Select value={voice} onValueChange={onVoiceChange}>
            <SelectTrigger data-testid="select-voice">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="child">Child</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Speed */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-2">
            Speaking Speed: {speed}x
          </label>
          <Slider
            value={[speed]}
            onValueChange={(v) => onSpeedChange(v[0])}
            min={0.5}
            max={2}
            step={0.1}
            data-testid="slider-speed"
          />
        </div>

        {/* Language */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-2">
            Language
          </label>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger data-testid="select-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="pidgin">Pidgin English</SelectItem>
              <SelectItem value="yoruba">Yoruba</SelectItem>
              <SelectItem value="igbo">Igbo</SelectItem>
              <SelectItem value="hausa">Hausa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tone */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-2">
            Teaching Tone
          </label>
          <Select value={tone} onValueChange={onToneChange}>
            <SelectTrigger data-testid="select-tone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="serious">Serious</SelectItem>
              <SelectItem value="exam">Exam Instructor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
