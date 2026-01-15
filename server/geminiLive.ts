import { WebSocket as WS } from "ws";
import { GoogleGenAI, Modality } from "@google/genai";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

interface GeminiLiveSession {
  ws: WS;
  userId: string;
  sessionId: string;
  audioBuffer: Buffer[];
  audioChunks: string[]; // For streaming chunks
  isConnected: boolean;
  isReceivingAudio: boolean;
  selectedVoice: string;
  language: string;
}

const activeSessions = new Map<string, GeminiLiveSession>();

export const GEMINI_VOICES = [
  { id: "Aoede", name: "Aoede", description: "Bright & melodic", gender: "female" },
  { id: "Charon", name: "Charon", description: "Deep & authoritative", gender: "male" },
  { id: "Fenrir", name: "Fenrir", description: "Strong & commanding", gender: "male" },
  { id: "Kore", name: "Kore", description: "Warm & nurturing", gender: "female" },
  { id: "Puck", name: "Puck", description: "Playful & energetic", gender: "neutral" },
];

export async function handleGeminiLiveConnection(ws: WS, userId: string) {
  const sessionId = `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const session: GeminiLiveSession = {
    ws,
    userId,
    sessionId,
    audioBuffer: [],
    audioChunks: [],
    isConnected: true,
    isReceivingAudio: false,
    selectedVoice: "Aoede",
    language: "en",
  };
  
  activeSessions.set(sessionId, session);
  console.log(`Gemini Live session started: ${sessionId} for user: ${userId}`);

  ws.send(JSON.stringify({
    type: "session_started",
    sessionId,
    voices: GEMINI_VOICES,
    message: "Connected to LEARNORY AI Voice. You can start speaking now.",
  }));

  ws.on("message", async (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case "audio_input":
          await handleAudioInput(session, data);
          break;
        case "audio_chunk":
          // Real-time streaming: accumulate chunks
          if (data.chunk) {
            session.audioChunks.push(data.chunk);
            if (!session.isReceivingAudio) {
              session.isReceivingAudio = true;
              ws.send(JSON.stringify({ type: "receiving_audio" }));
            }
          }
          break;
        case "audio_end":
          // End of audio stream, process accumulated chunks
          if (session.audioChunks.length > 0) {
            const combinedAudio = session.audioChunks.join("");
            session.audioChunks = [];
            session.isReceivingAudio = false;
            await handleAudioInput(session, { audio: combinedAudio });
          }
          break;
        case "text_input":
          await handleTextInput(session, data.text);
          break;
        case "set_voice":
          session.selectedVoice = data.voice || "Aoede";
          ws.send(JSON.stringify({ type: "voice_changed", voice: session.selectedVoice }));
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

async function handleAudioInput(session: GeminiLiveSession, data: any) {
  if (!GOOGLE_API_KEY) {
    session.ws.send(JSON.stringify({
      type: "error",
      message: "AI service not configured",
    }));
    return;
  }

  try {
    session.ws.send(JSON.stringify({ type: "processing_started" }));

    const audioBase64 = data.audio;
    if (!audioBase64) {
      throw new Error("No audio data provided");
    }

    const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
    
    const systemPrompt = `You are LEARNORY, an advanced AI tutor specializing in Nigerian education (JAMB, WAEC, NECO).
Voice: ${session.selectedVoice}
Language preference: ${session.language}

IMPORTANT RESPONSE FORMAT:
1. First, transcribe what the student said in brackets: [User said: "...their words..."]
2. Then, provide your helpful response

Keep responses conversational and brief for voice. Speak naturally as if in a friendly tutoring session.
Focus on:
- Being encouraging and supportive
- Explaining concepts clearly and simply
- Using examples relevant to Nigerian students
- Answering questions directly and helpfully`;

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
    
    // Extract user transcript if present in format [User said: "..."]
    let userTranscript = "";
    let aiResponse = fullResponse;
    
    const transcriptMatch = fullResponse.match(/\[User said:\s*"(.+?)"\]/i);
    if (transcriptMatch) {
      userTranscript = transcriptMatch[1];
      aiResponse = fullResponse.replace(transcriptMatch[0], "").trim();
    }
    
    // Send user transcript if found
    if (userTranscript) {
      session.ws.send(JSON.stringify({
        type: "user_transcript",
        text: userTranscript,
      }));
    }
    
    session.ws.send(JSON.stringify({
      type: "ai_response",
      text: aiResponse,
      voice: session.selectedVoice,
      userTranscript: userTranscript || undefined,
    }));

    session.ws.send(JSON.stringify({ type: "processing_complete" }));

  } catch (error: any) {
    console.error("Gemini Live audio processing error:", error);
    session.ws.send(JSON.stringify({
      type: "error",
      message: error.message || "Failed to process audio",
    }));
    session.ws.send(JSON.stringify({ type: "processing_complete" }));
  }
}

async function handleTextInput(session: GeminiLiveSession, text: string) {
  if (!GOOGLE_API_KEY) {
    session.ws.send(JSON.stringify({
      type: "error",
      message: "AI service not configured",
    }));
    return;
  }

  try {
    session.ws.send(JSON.stringify({ type: "processing_started" }));

    const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
    
    const systemPrompt = `You are LEARNORY, an advanced AI tutor specializing in Nigerian education (JAMB, WAEC, NECO).

IMPORTANT: Keep responses conversational and brief for voice interaction. Speak naturally as if in a friendly tutoring session.
Focus on:
- Being encouraging and supportive
- Explaining concepts clearly and simply
- Using examples relevant to Nigerian students
- Answering questions directly and helpfully

Student says: ${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
    });

    const textResponse = response.text || "I'm not sure how to respond to that. Could you please rephrase?";
    
    session.ws.send(JSON.stringify({
      type: "ai_response",
      text: textResponse,
      voice: session.selectedVoice,
    }));

    session.ws.send(JSON.stringify({ type: "processing_complete" }));

  } catch (error: any) {
    console.error("Gemini Live text processing error:", error);
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
    activeSessions.delete(sessionId);
  }
}

export function getActiveSessionCount(): number {
  return activeSessions.size;
}
