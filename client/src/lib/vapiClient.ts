/**
 * Vapi Public API Client - Real-time voice conversation
 * Uses Vapi's Web SDK for direct frontend voice integration
 */

export class VapiClient {
  private vapi: any = null;
  private publicKey: string = "";
  private isInitialized = false;
  private messageHandlers: Set<(msg: any) => void> = new Set();
  private eventHandlers: Map<string, Set<(args: any) => void>> = new Map();

  async initialize(publicKey: string): Promise<void> {
    this.publicKey = publicKey;

    return new Promise((resolve, reject) => {
      if ((window as any).Vapi) {
        try {
          this.vapi = new (window as any).Vapi(publicKey);
          this.setupEventListeners();
          this.isInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest";
      script.async = true;

      script.onload = () => {
        try {
          this.vapi = new (window as any).Vapi(publicKey);
          this.setupEventListeners();
          this.isInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      script.onerror = () => {
        reject(new Error("Failed to load Vapi SDK"));
      };

      document.head.appendChild(script);
    });
  }

  private setupEventListeners(): void {
    if (!this.vapi) return;

    this.vapi.on("call-start", () => {
      this.emit("callStart", {});
    });

    this.vapi.on("call-end", () => {
      this.emit("callEnd", {});
    });

    this.vapi.on("speech-start", () => {
      this.emit("speechStart", {});
    });

    this.vapi.on("speech-end", () => {
      this.emit("speechEnd", {});
    });

    this.vapi.on("message", (message: any) => {
      this.handleVapiMessage(message);
    });

    this.vapi.on("error", (error: any) => {
      this.emit("error", error);
    });
  }

  private handleVapiMessage(message: any): void {
    if (message.type === "transcript") {
      this.emit("transcript", {
        role: message.role || "user",
        content: message.transcript,
      });
    } else if (message.type === "message") {
      this.emit("message", message);
    }
  }

  async startCall(config: any): Promise<void> {
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
        systemPrompt: config.systemPrompt || "You are a helpful AI tutor.",
      },
      voice: {
        provider: "openai",
        voiceId,
      },
      firstMessage:
        config.firstMessage ||
        "Hello! I'm your LEARNORY AI tutor. What would you like to learn about today?",
      endCallMessage: "Thank you for learning with LEARNORY. Keep up the great work!",
      enableTranscript: true,
      silenceTimeout: 10,
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

  on(event: string, handler: (args: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  private emit(event: string, args: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(args));
    }
  }

  isCallActive(): boolean {
    return this.vapi?.isCallActive || false;
  }

  getTranscript(): string {
    return this.vapi?.transcript || "";
  }
}

export const vapiClient = new VapiClient();
