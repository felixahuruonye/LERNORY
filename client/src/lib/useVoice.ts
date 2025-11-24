import { useCallback, useRef, useState } from "react";

// Available OpenAI TTS voices
export const AVAILABLE_VOICES = [
  { name: "Adam", voiceName: "en-US-Neural2-A", gender: "male" },
  { name: "Aria", voiceName: "en-US-Neural2-C", gender: "female" },
  { name: "Guy", voiceName: "en-US-Neural2-B", gender: "male" },
  { name: "Zira", voiceName: "en-US-Neural2-E", gender: "female" },
];

const DEFAULT_VOICE = "Adam";

// Text preprocessing function
function preprocessTextForSpeech(text: string): string {
  // Replace LEARNORY to preserve it as a word
  let processed = text.replace(/LEARNORY/gi, "LEARNORY");
  
  // Remove markdown and special formatting
  processed = processed
    .replace(/\*\*/g, "") // Remove bold markers
    .replace(/\*/g, "") // Remove italic markers
    .replace(/`/g, "") // Remove code markers
    .replace(/#{1,6}\s/g, "") // Remove heading markers
    .replace(/^\s*[-•]\s/gm, "") // Remove bullet points
    .replace(/^\s*\d+\.\s/gm, "") // Remove numbered lists
    .replace(/\[.*?\]\(.*?\)/g, "") // Remove markdown links
    .replace(/\n\n+/g, "\n") // Collapse multiple newlines
    .replace(/[\(\)\[\]\{\}]/g, " "); // Remove brackets
  
  // Remove extra whitespace
  processed = processed
    .replace(/\s+/g, " ") // Multiple spaces to single space
    .trim();
  
  return processed;
}

export function useVoice() {
  const [selectedVoice, setSelectedVoice] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedVoice") || DEFAULT_VOICE;
    }
    return DEFAULT_VOICE;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(
    async (text: string) => {
      try {
        setIsPlaying(true);
        
        const processedText = preprocessTextForSpeech(text);
        if (!processedText.trim()) {
          setIsPlaying(false);
          return;
        }

        const voiceInfo = AVAILABLE_VOICES.find((v) => v.name === selectedVoice);
        
        const response = await fetch("/api/tts/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: processedText,
            voiceName: voiceInfo?.voiceName || "en-US-Neural2-A",
          }),
        });

        if (!response.ok) {
          throw new Error("TTS request failed");
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        } else {
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio.play();
          
          audio.onended = () => {
            setIsPlaying(false);
            URL.revokeObjectURL(audioUrl);
          };
          audio.onerror = () => {
            setIsPlaying(false);
            URL.revokeObjectURL(audioUrl);
          };
        }
      } catch (error) {
        console.error("TTS error:", error);
        setIsPlaying(false);
      }
    },
    [selectedVoice]
  );

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const toggleSpeak = useCallback(
    (text: string) => {
      if (isPlaying) {
        stop();
      } else {
        speak(text);
      }
    },
    [isPlaying, speak, stop]
  );

  return {
    speak,
    stop,
    toggleSpeak,
    isPlaying,
    selectedVoice,
    setSelectedVoice,
    isSpeechAvailable: true,
    availableVoices: AVAILABLE_VOICES,
  };
}
