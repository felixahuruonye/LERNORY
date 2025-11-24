/**
 * Vapi Client - Handles all Vapi API interactions
 * Uses Vapi's public API for voice conversations
 */

export interface VapiConfig {
  publicKey: string;
}

export interface VapiMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

export interface VapiCallOptions {
  assistantId?: string;
  assistantOverrides?: {
    model?: { model: string; provider: string };
    voice?: { provider: string; voiceId: string };
    firstMessage?: string;
    systemPrompt?: string;
  };
}

class VapiClient {
  private publicKey: string | null = null;
  private vapi: any = null;
  private callStartTime: number = 0;
  private messages: VapiMessage[] = [];

  async initialize(publicKey: string): Promise<void> {
    this.publicKey = publicKey;

    // Load Vapi SDK dynamically
    return new Promise((resolve, reject) => {
      // Check if Vapi is already loaded
      if ((window as any).Vapi) {
        this.vapi = new (window as any).Vapi(publicKey);
        resolve();
        return;
      }

      // Load Vapi script
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest";
      script.async = true;
      script.onload = () => {
        try {
          this.vapi = new (window as any).Vapi(publicKey);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = () => reject(new Error("Failed to load Vapi SDK"));
      document.head.appendChild(script);
    });
  }

  async startCall(options?: VapiCallOptions): Promise<void> {
    if (!this.vapi) {
      throw new Error("Vapi not initialized");
    }

    this.callStartTime = Date.now();
    this.messages = [];

    const assistantConfig = {
      name: "LEARNORY AI Tutor",
      model: {
        provider: "openai",
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are LEARNORY ULTRA, an advanced AI educational tutor. You provide clear, engaging explanations to students. 
            - Keep responses concise unless asked for more detail
            - Use examples relevant to the student's context
            - Identify weak topics and offer targeted help
            - Adapt your teaching style to the student's level
            - Be encouraging and supportive`,
          },
        ],
        temperature: 0.7,
      },
      voice: {
        provider: "openai",
        voiceId: "nova",
      },
      firstMessage: "Hello! I'm LEARNORY AI. What would you like to learn about today?",
      endCallMessage: "Thank you for learning with LEARNORY. Keep up the great work!",
      ...options?.assistantOverrides,
    };

    await this.vapi.start(assistantConfig);
  }

  async stopCall(): Promise<void> {
    if (!this.vapi) {
      throw new Error("Vapi not initialized");
    }
    await this.vapi.stop();
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

  async uploadFile(file: File): Promise<string> {
    /**
     * Upload file to Vapi for analysis
     * Returns file URL/ID for reference
     */
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("https://api.vapi.ai/v1/files/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.publicKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      const data = await response.json();
      return data.fileId || data.url;
    } catch (error) {
      console.error("File upload error:", error);
      throw error;
    }
  }

  setVoice(
    provider: "openai" | "elevenlabs",
    voiceId: string,
    speed: number = 1
  ): void {
    /**
     * Update voice settings during active call
     */
    if (this.vapi) {
      this.vapi.setVoice({
        provider,
        voiceId,
        speed,
      });
    }
  }

  onCallStart(callback: () => void): void {
    if (this.vapi) {
      this.vapi.on("call-start", callback);
    }
  }

  onCallEnd(callback: () => void): void {
    if (this.vapi) {
      this.vapi.on("call-end", callback);
    }
  }

  onSpeechStart(callback: () => void): void {
    if (this.vapi) {
      this.vapi.on("speech-start", callback);
    }
  }

  onSpeechEnd(callback: () => void): void {
    if (this.vapi) {
      this.vapi.on("speech-end", callback);
    }
  }

  onMessage(callback: (message: any) => void): void {
    if (this.vapi) {
      this.vapi.on("message", callback);
    }
  }

  onTranscript(callback: (transcript: any) => void): void {
    if (this.vapi) {
      this.vapi.on("transcript", callback);
    }
  }

  onError(callback: (error: any) => void): void {
    if (this.vapi) {
      this.vapi.on("error", callback);
    }
  }

  getCallDuration(): number {
    if (this.callStartTime === 0) return 0;
    return Math.floor((Date.now() - this.callStartTime) / 1000);
  }

  getMessages(): VapiMessage[] {
    return this.messages;
  }

  addMessage(message: VapiMessage): void {
    this.messages.push({
      ...message,
      timestamp: message.timestamp || Date.now(),
    });
  }
}

// Export singleton instance
export const vapiClient = new VapiClient();
