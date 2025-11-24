import { useCallback, useRef, useEffect, useState } from "react";

// Available Google voices with Nigerian options
export const AVAILABLE_VOICES = [
  { name: "Adam", lang: "en-US", gender: "male" },
  { name: "Zira", lang: "en-US", gender: "female" },
  { name: "Guy", lang: "en-US", gender: "male" },
  { name: "Aria", lang: "en-US", gender: "female" },
  { name: "Chimamanda", lang: "en-NG", gender: "female", nigerian: true }, // Nigerian female
  { name: "Chidi", lang: "en-NG", gender: "male", nigerian: true }, // Nigerian male
];

const DEFAULT_VOICE = "Adam";

export function useVoice() {
  const [selectedVoice, setSelectedVoice] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedVoice") || DEFAULT_VOICE;
    }
    return DEFAULT_VOICE;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeechAvailable] = useState(
    typeof window !== "undefined" &&
      ("speechSynthesis" in window || "webkitSpeechSynthesis" in window)
  );

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Save voice preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedVoice", selectedVoice);
    }
  }, [selectedVoice]);

  const speak = useCallback(
    (text: string) => {
      if (!isSpeechAvailable) {
        console.warn("Speech synthesis not available");
        return;
      }

      const synth = window.speechSynthesis || (window as any).webkitSpeechSynthesis;

      // Cancel any ongoing speech
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Get voice info
      const voiceInfo = AVAILABLE_VOICES.find((v) => v.name === selectedVoice);

      // Set voice properties
      utterance.lang = voiceInfo?.lang || "en-US";
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Set voice from available voices
      const allVoices = synth.getVoices();
      const matchedVoice = allVoices.find(
        (v: SpeechSynthesisVoice) =>
          v.name.includes(selectedVoice) || v.lang === voiceInfo?.lang
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      utteranceRef.current = utterance;
      synth.speak(utterance);
    },
    [selectedVoice, isSpeechAvailable]
  );

  const stop = useCallback(() => {
    if (typeof window !== "undefined") {
      const synth = window.speechSynthesis || (window as any).webkitSpeechSynthesis;
      synth.cancel();
      setIsPlaying(false);
    }
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
    isSpeechAvailable,
    availableVoices: AVAILABLE_VOICES,
  };
}
