import { WebSocket as WS } from "ws";
import { GoogleGenAI, Modality } from "@google/genai";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

interface GeminiLiveSession {
  ws: WS;
  userId: string;
  sessionId: string;
  isConnected: boolean;
  isReceivingAudio: boolean;
  selectedVoice: string;
  language: string;
  liveSession: any | null;
  isStreaming: boolean;
}

const activeSessions = new Map<string, GeminiLiveSession>();

export const GEMINI_VOICES = [
  { id: "Aoede", name: "Aoede", description: "Bright & melodic", gender: "female" },
  { id: "Charon", name: "Charon", description: "Deep & authoritative", gender: "male" },
  { id: "Fenrir", name: "Fenrir", description: "Strong & commanding", gender: "male" },
  { id: "Kore", name: "Kore", description: "Warm & nurturing", gender: "female" },
  { id: "Puck", name: "Puck", description: "Playful & energetic", gender: "neutral" },
];

// Use the latest Live API model
const LIVE_MODEL = "gemini-2.0-flash-live-001";

export async function handleGeminiLiveConnection(ws: WS, userId: string) {
  const sessionId = `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const session: GeminiLiveSession = {
    ws,
    userId,
    sessionId,
    isConnected: true,
    isReceivingAudio: false,
    selectedVoice: "Aoede",
    language: "en",
    liveSession: null,
    isStreaming: false,
  };
  
  activeSessions.set(sessionId, session);
  console.log(`Gemini Live session started: ${sessionId} for user: ${userId}`);

  // Initialize Gemini Live connection
  await initializeGeminiLiveSession(session);

  ws.send(JSON.stringify({
    type: "session_started",
    sessionId,
    voices: GEMINI_VOICES,
    message: "Connected to LEARNORY AI Voice with Gemini Live streaming.",
  }));

  ws.on("message", async (message: Buffer) => {
    try {
      // Check if it's binary audio data
      if (message[0] !== 0x7b) { // Not starting with '{' - likely binary
        await handleBinaryAudio(session, message);
        return;
      }

      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case "audio_input":
          await handleAudioInput(session, data);
          break;
        case "audio_chunk":
          await handleAudioChunk(session, data);
          break;
        case "audio_end":
          await handleAudioEnd(session);
          break;
        case "text_input":
          await handleTextInput(session, data.text);
          break;
        case "set_voice":
          session.selectedVoice = data.voice || "Aoede";
          ws.send(JSON.stringify({ type: "voice_changed", voice: session.selectedVoice }));
          // Reinitialize with new voice
          await initializeGeminiLiveSession(session);
          break;
        case "set_language":
          session.language = data.language || "en";
          ws.send(JSON.stringify({ type: "language_changed", language: session.language }));
          break;
        case "end_session":
          closeSession(sessionId);
          break;
        default:
          console.log("Unknown message type:", data.type);
      }
    } catch (error) {
      console.error("Error processing Gemini Live message:", error);
      ws.send(JSON.stringify({
        type: "error",
        message: "Failed to process message",
      }));
    }
  });

  ws.on("close", () => {
    console.log(`Gemini Live session closed: ${sessionId}`);
    closeSession(sessionId);
  });

  ws.on("error", (error) => {
    console.error(`Gemini Live session error: ${sessionId}`, error);
    closeSession(sessionId);
  });
}

async function initializeGeminiLiveSession(session: GeminiLiveSession) {
  if (!GOOGLE_API_KEY) {
    console.error("No GOOGLE_API_KEY configured");
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
    
    const config = {
      responseModalities: [Modality.AUDIO, Modality.TEXT],
      systemInstruction: `You are LEARNORY, an advanced AI tutor specializing in Nigerian education (JAMB, WAEC, NECO).
        
Voice: ${session.selectedVoice}
Language: ${session.language}

Guidelines:
- Be encouraging, supportive, and patient
- Explain concepts clearly and simply
- Use examples relevant to Nigerian students  
- Keep responses conversational for voice interaction
- Answer questions directly and helpfully
- When you hear audio, first acknowledge what the student said, then respond
- For math and science, explain step by step`,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: session.selectedVoice,
          },
        },
      },
    };

    // Try to establish live connection
    try {
      const liveSession = await (ai as any).live?.connect(LIVE_MODEL, config);
      if (liveSession) {
        session.liveSession = liveSession;
        console.log(`Gemini Live session established for ${session.sessionId}`);
        
        // Start listening for responses
        startReceivingResponses(session);
      }
    } catch (liveError: any) {
      console.log("Live API not available, using fallback:", liveError.message);
      session.liveSession = null;
    }
  } catch (error) {
    console.error("Error initializing Gemini Live:", error);
  }
}

async function startReceivingResponses(session: GeminiLiveSession) {
  if (!session.liveSession) return;

  try {
    for await (const response of session.liveSession.receive()) {
      if (!session.isConnected) break;

      // Handle audio response
      if (response.audio) {
        const audioBase64 = Buffer.from(response.audio).toString('base64');
        session.ws.send(JSON.stringify({
          type: "audio_output",
          audio: audioBase64,
          mimeType: "audio/pcm;rate=24000",
          isStreaming: true,
        }));
      }

      // Handle text response (transcript)
      if (response.text) {
        session.ws.send(JSON.stringify({
          type: "ai_response",
          text: response.text,
          voice: session.selectedVoice,
          hasAudio: !!response.audio,
        }));
      }

      // Handle turn complete
      if (response.turnComplete) {
        session.ws.send(JSON.stringify({ type: "processing_complete" }));
      }
    }
  } catch (error) {
    console.error("Error receiving Gemini responses:", error);
  }
}

async function handleBinaryAudio(session: GeminiLiveSession, audioData: Buffer) {
  if (!session.liveSession) {
    // Fallback to base64 processing
    const base64 = audioData.toString('base64');
    await handleAudioInput(session, { audio: base64 });
    return;
  }

  try {
    // Send raw audio to Gemini Live session
    await session.liveSession.sendRealtimeInput({
      audio: audioData,
      mimeType: "audio/pcm;rate=16000",
    });
    
    if (!session.isReceivingAudio) {
      session.isReceivingAudio = true;
      session.ws.send(JSON.stringify({ type: "receiving_audio" }));
    }
  } catch (error) {
    console.error("Error sending binary audio:", error);
  }
}

async function handleAudioChunk(session: GeminiLiveSession, data: any) {
  if (!data.chunk) return;

  if (session.liveSession) {
    try {
      // Decode base64 and send to live session
      const audioBuffer = Buffer.from(data.chunk, 'base64');
      await session.liveSession.sendRealtimeInput({
        audio: audioBuffer,
        mimeType: "audio/pcm;rate=16000",
      });
      
      if (!session.isReceivingAudio) {
        session.isReceivingAudio = true;
        session.ws.send(JSON.stringify({ type: "receiving_audio" }));
      }
    } catch (error) {
      console.error("Error sending audio chunk:", error);
    }
  }
}

async function handleAudioEnd(session: GeminiLiveSession) {
  session.isReceivingAudio = false;
  
  if (session.liveSession) {
    try {
      // Signal end of audio input
      await session.liveSession.sendRealtimeInput({ endOfTurn: true });
      session.ws.send(JSON.stringify({ type: "processing_started" }));
    } catch (error) {
      console.error("Error ending audio:", error);
    }
  }
}

async function handleAudioInput(session: GeminiLiveSession, data: any) {
  if (!GOOGLE_API_KEY) {
    session.ws.send(JSON.stringify({
      type: "error",
      message: "AI service not configured",
    }));
    return;
  }

  const audioBase64 = data.audio;
  if (!audioBase64) {
    session.ws.send(JSON.stringify({
      type: "error",
      message: "No audio data provided",
    }));
    return;
  }

  session.ws.send(JSON.stringify({ type: "processing_started" }));

  // If live session is available, use it
  if (session.liveSession) {
    try {
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      await session.liveSession.sendRealtimeInput({
        audio: audioBuffer,
        mimeType: "audio/webm",
      });
      await session.liveSession.sendRealtimeInput({ endOfTurn: true });
      return;
    } catch (error) {
      console.error("Live session audio failed, using fallback:", error);
    }
  }

  // Fallback: Use generateContent with audio input/output
  await processAudioWithFallback(session, audioBase64);
}

async function processAudioWithFallback(session: GeminiLiveSession, audioBase64: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY! });
    
    const systemPrompt = `You are LEARNORY, an advanced AI tutor specializing in Nigerian education.
Voice: ${session.selectedVoice}

IMPORTANT RESPONSE FORMAT:
1. First, transcribe what the student said in brackets: [User said: "...their words..."]
2. Then, provide your helpful response

Keep responses conversational and brief for voice. Speak naturally as if in a friendly tutoring session.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [
            { text: systemPrompt },
            {
              inlineData: {
                mimeType: "audio/webm",
                data: audioBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.TEXT],
      },
    });

    const fullResponse = response.text || "I heard you, but I'm not sure how to respond. Could you please repeat that?";
    
    // Extract user transcript
    let userTranscript = "";
    let aiResponse = fullResponse;
    
    const transcriptMatch = fullResponse.match(/\[User said:\s*"(.+?)"\]/i);
    if (transcriptMatch) {
      userTranscript = transcriptMatch[1];
      aiResponse = fullResponse.replace(transcriptMatch[0], "").trim();
    }
    
    if (userTranscript) {
      session.ws.send(JSON.stringify({
        type: "user_transcript",
        text: userTranscript,
      }));
    }
    
    // Try to generate TTS audio
    const audioData = await generateTTSAudio(session, aiResponse);
    
    if (audioData) {
      session.ws.send(JSON.stringify({
        type: "audio_output",
        audio: audioData,
        mimeType: "audio/mp3",
      }));
    }
    
    session.ws.send(JSON.stringify({
      type: "ai_response",
      text: aiResponse,
      voice: session.selectedVoice,
      userTranscript: userTranscript || undefined,
      hasAudio: !!audioData,
      useBrowserTTS: !audioData,
    }));

    session.ws.send(JSON.stringify({ type: "processing_complete" }));

  } catch (error: any) {
    console.error("Fallback audio processing error:", error);
    session.ws.send(JSON.stringify({
      type: "error",
      message: error.message || "Failed to process audio",
    }));
    session.ws.send(JSON.stringify({ type: "processing_complete" }));
  }
}

async function generateTTSAudio(session: GeminiLiveSession, text: string): Promise<string | null> {
  if (!GOOGLE_API_KEY) return null;
  
  try {
    const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [{ text: `Please read this aloud naturally and warmly: "${text}"` }],
        },
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: session.selectedVoice,
            },
          },
        },
      } as any,
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if ((part as any).inlineData?.mimeType?.startsWith("audio/")) {
        return (part as any).inlineData.data;
      }
    }
  } catch (error) {
    console.error("TTS generation error:", error);
  }
  
  return null;
}

async function handleTextInput(session: GeminiLiveSession, text: string) {
  if (!GOOGLE_API_KEY) {
    session.ws.send(JSON.stringify({
      type: "error",
      message: "AI service not configured",
    }));
    return;
  }

  session.ws.send(JSON.stringify({ type: "processing_started" }));

  // If live session available, send text through it
  if (session.liveSession) {
    try {
      await session.liveSession.send({ text });
      return;
    } catch (error) {
      console.error("Live session text failed, using fallback:", error);
    }
  }

  // Fallback to generateContent
  try {
    const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
    
    const systemPrompt = `You are LEARNORY, an advanced AI tutor specializing in Nigerian education.
Keep responses conversational and brief for voice interaction.
Student says: ${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
    });

    const textResponse = response.text || "I'm not sure how to respond.";
    
    // Generate TTS
    const audioData = await generateTTSAudio(session, textResponse);
    
    if (audioData) {
      session.ws.send(JSON.stringify({
        type: "audio_output",
        audio: audioData,
        mimeType: "audio/mp3",
      }));
    }
    
    session.ws.send(JSON.stringify({
      type: "ai_response",
      text: textResponse,
      voice: session.selectedVoice,
      hasAudio: !!audioData,
      useBrowserTTS: !audioData,
    }));

    session.ws.send(JSON.stringify({ type: "processing_complete" }));

  } catch (error: any) {
    console.error("Text processing error:", error);
    session.ws.send(JSON.stringify({
      type: "error",
      message: error.message || "Failed to process text",
    }));
    session.ws.send(JSON.stringify({ type: "processing_complete" }));
  }
}

function closeSession(sessionId: string) {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.isConnected = false;
    if (session.liveSession) {
      try {
        session.liveSession.close?.();
      } catch (e) {
        console.error("Error closing live session:", e);
      }
    }
    activeSessions.delete(sessionId);
  }
}

export function getActiveSessionCount(): number {
  return activeSessions.size;
}
