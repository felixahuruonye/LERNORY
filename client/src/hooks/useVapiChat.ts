import { useState, useCallback, useEffect, useRef } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface UseVapiChatReturn {
  messages: Message[];
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  sendMessage: (content: string) => Promise<void>;
  startVoiceCall: () => Promise<void>;
  endVoiceCall: () => Promise<void>;
  clearMessages: () => void;
}

export function useVapiChat(): UseVapiChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const vapiRef = useRef<any>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("vapi_messages");
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to load messages from localStorage:", e);
      }
    }
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    localStorage.setItem("vapi_messages", JSON.stringify(messages));
  }, [messages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Simulate AI response - will be replaced with actual Vapi integration
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `I received your message: "${content}". I'm ready to help!`,
        timestamp: Date.now(),
      };

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }, []);

  const startVoiceCall = useCallback(async () => {
    try {
      setIsConnected(true);
      setIsListening(true);
      // Vapi integration will happen here
    } catch (error) {
      console.error("Error starting voice call:", error);
      setIsConnected(false);
    }
  }, []);

  const endVoiceCall = useCallback(async () => {
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem("vapi_messages");
  }, []);

  return {
    messages,
    isConnected,
    isListening,
    isSpeaking,
    sendMessage,
    startVoiceCall,
    endVoiceCall,
    clearMessages,
  };
}
