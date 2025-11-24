/**
 * Vapi Web Service - Real integration with Vapi public API
 * Handles voice calls, speech recognition, and text-to-speech
 */

export interface VapiMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface VapiStreamConfig {
  voice: "female" | "male";
  speed: number;
  language: string;
  tone: string;
  sessionId?: string;
}

class VapiWebService {
  private vapi: any = null;
  private publicKey: string | null = null;
  private isInitialized = false;
  private messageHandlers: ((msg: VapiMessage) => void)[] = [];
  private eventHandlers: any = {};

  async initialize(publicKey: string): Promise<void> {
    this.publicKey = publicKey;

    return new Promise((resolve, reject) => {
      if ((window as any).Vapi) {
        this.vapi = new (window as any).Vapi(publicKey);
        this.setupEventHandlers();
        this.isInitialized = true;
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest";
      script.async = true;
      script.onload = () => {
        try {
          this.vapi = new (window as any).Vapi(publicKey);
          this.setupEventHandlers();
          this.isInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = () => reject(new Error("Failed to load Vapi SDK"));
      document.head.appendChild(script);
    });
  }

  private setupEventHandlers(): void {
    if (!this.vapi) return;

    this.vapi.on("call-start", () => {
      this.emit("callStart");
    });

    this.vapi.on("call-end", () => {
      this.emit("callEnd");
    });

    this.vapi.on("speech-start", () => {
      this.emit("speechStart");
    });

    this.vapi.on("speech-end", () => {
      this.emit("speechEnd");
    });

    this.vapi.on("message", (message: any) => {
      if (message.type === "transcript" && message.transcript) {
        // Speech recognition result
        this.emit("transcript", {
          role: "user",
          content: message.transcript,
          timestamp: Date.now(),
        });
      }
    });

    this.vapi.on("error", (error: any) => {
      this.emit("error", error);
    });
  }

  async startCall(config: VapiStreamConfig): Promise<void> {
    if (!this.isInitialized || !this.vapi) {
      throw new Error("Vapi not initialized");
    }

    const voiceId = config.voice === "female" ? "nova" : "onyx";

    const assistantConfig = {
      name: "LEARNORY AI Tutor",
      model: {
        provider: "openai",
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        maxTokens: 300,
      },
      voice: {
        provider: "openai",
        voiceId,
      },
      firstMessage: `Hello! I'm your LEARNORY AI tutor speaking at ${config.speed}x speed. What would you like to learn today?`,
      endCallMessage: "Thank you for learning with LEARNORY. Keep up the great work!",
      enableTranscript: true,
      silenceTimeout: 5,
      messageTimeout: 30,
    };

    await this.vapi.start(assistantConfig);
  }

  async stopCall(): Promise<void> {
    if (this.vapi) {
      await this.vapi.stop();
    }
  }

  async mute(): Promise<void> {
    if (this.vapi) {
      await this.vapi.mute();
    }
  }

  async unmute(): Promise<void> {
    if (this.vapi) {
      await this.vapi.unmute();
    }
  }

  /**
   * Send text to Vapi for voice output (text-to-speech)
   */
  async speakText(text: string): Promise<void> {
    if (!this.vapi) {
      throw new Error("Vapi not initialized");
    }

    // Clean text for speech (remove markdown, emojis, etc.)
    const cleanText = text
      .replace(/[*_`#~]/g, "") // Remove markdown
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, "") // Remove emojis
      .trim();

    // Send message through Vapi (will be read aloud)
    try {
      await this.vapi.say(cleanText);
    } catch (error) {
      console.error("Error speaking text:", error);
    }
  }

  /**
   * Get transcript (user speech to text)
   */
  getTranscript(): string | null {
    if (!this.vapi) return null;
    return this.vapi.transcript;
  }

  /**
   * Register message handler
   */
  onMessage(handler: (msg: VapiMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Register event handler
   */
  on(event: string, handler: (...args: any[]) => void): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  /**
   * Emit events
   */
  private emit(event: string, ...args: any[]): void {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach((handler: any) => {
        handler(...args);
      });
    }
  }

  /**
   * Check if call is active
   */
  isCallActive(): boolean {
    return this.vapi?.isCallActive || false;
  }

  /**
   * Get call duration in seconds
   */
  getCallDuration(): number {
    return this.vapi?.callDuration || 0;
  }
}

export const vapiWebService = new VapiWebService();
