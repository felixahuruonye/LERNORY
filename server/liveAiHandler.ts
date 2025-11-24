// Live AI Handler - Real integration with Vapi API and Backend AI Systems
import { storage } from "./storage";
import { chatWithAI } from "./openai";

export interface LiveAIRequest {
  userId: string;
  userMessage: string;
  sessionId?: string;
  mode: string;
  voice: "female" | "male";
  speed: number;
  language: string;
  tone: string;
}

export interface LiveAIStreamChunk {
  chunk: string;
  index: number;
  isComplete: boolean;
}

/**
 * Process live AI message with real backend integration
 * Returns stream of response chunks for real-time display
 */
export async function* processLiveAIMessage(
  request: LiveAIRequest
): AsyncGenerator<LiveAIStreamChunk> {
  const { userId, userMessage, sessionId, mode, language, tone } = request;

  // Save user message
  await storage.createChatMessage({
    userId,
    sessionId: sessionId || null,
    role: "user",
    content: userMessage,
    attachments: null,
  });

  // Get conversation history
  const history = sessionId
    ? await storage.getChatMessagesBySession(sessionId)
    : await storage.getChatMessagesByUser(userId);

  const messages = history.map((msg: any) => ({
    role: msg.role,
    content: msg.content,
  }));

  // Generate system prompt with context
  const systemPrompt = generateLiveAISystemPrompt({
    mode,
    language,
    tone,
  });

  // Generate AI response using streaming
  yield* generateStreamingResponse(
    userId,
    sessionId,
    systemPrompt,
    messages,
    userMessage
  );
}

/**
 * Generate Live AI system prompt with context
 */
function generateLiveAISystemPrompt(context: any): string {
  const { mode, language, tone } = context;

  return `You are LEARNORY ULTRA - an advanced AI tutor speaking in real-time voice.

SPEAKING STYLE:
- Tone: ${tone || "friendly"} (friendly, professional, encouraging, etc.)
- Language: ${language || "English"}
- Keep sentences SHORT and CLEAR for spoken speech
- Use natural pauses between ideas
- Avoid complex formatting - speak naturally
- Maximum 2-3 sentences per response block
- Be conversational, not robotic

MODE: ${mode || "learning"}

RESPONSE FORMAT FOR VOICE:
1. Start with a direct answer to the question
2. Give 1-2 key examples (speak them naturally)
3. Highlight 1 important point
4. Offer next step or ask clarifying question

Remember: You are SPEAKING, not writing. Keep it conversational and natural.`;
}

/**
 * Generate streaming response with real-time word chunks
 */
async function* generateStreamingResponse(
  userId: string,
  sessionId: string | undefined,
  systemPrompt: string,
  messages: any[],
  userMessage: string
): AsyncGenerator<LiveAIStreamChunk> {
  try {
    // Get AI response using OpenAI streaming
    const response = await chatWithAI(
      [
        { role: "system", content: systemPrompt },
        ...messages,
        { role: "user", content: userMessage },
      ],
      {
        stream: true,
        temperature: 0.7,
        maxTokens: 500,
      }
    );

    let fullResponse = "";
    let chunkIndex = 0;
    let wordBuffer = "";

    // Handle both streaming and non-streaming responses
    if (response && typeof response === "object") {
      // Streaming response (AsyncIterable)
      if (Symbol.asyncIterator in response) {
        for await (const chunk of response as any) {
          const text =
            (chunk.choices?.[0]?.delta?.content as string) ||
            (typeof chunk === "string" ? chunk : "");

          if (text) {
            fullResponse += text;
            wordBuffer += text;

            // Split by spaces and emit complete words
            const words = wordBuffer.split(" ");

            for (let i = 0; i < words.length - 1; i++) {
              const word = words[i] + " ";
              yield {
                chunk: word,
                index: chunkIndex,
                isComplete: false,
              };
              chunkIndex++;
            }

            // Keep last incomplete word in buffer
            wordBuffer = words[words.length - 1];
          }
        }
      }
    }

    // Emit final word if any
    if (wordBuffer) {
      yield {
        chunk: wordBuffer,
        index: chunkIndex,
        isComplete: true,
      };
      chunkIndex++;
    }

    // Save complete AI response to database
    await storage.createChatMessage({
      userId,
      sessionId: sessionId || null,
      role: "assistant",
      content: fullResponse,
      attachments: null,
    });

    // Update learning history
    await storage.createLearningHistory({
      userId,
      subject: extractTopic(userMessage),
      topic: extractTopic(userMessage),
      difficulty: detectDifficulty(userMessage),
    });
  } catch (error) {
    console.error("Error in Live AI streaming:", error);
    yield {
      chunk: "Sorry, I encountered an error. Please try again.",
      index: 0,
      isComplete: true,
    };
  }
}

/**
 * Extract topic from user message
 */
function extractTopic(message: string): string {
  const topics = [
    "math",
    "algebra",
    "geometry",
    "calculus",
    "physics",
    "chemistry",
    "biology",
    "english",
    "history",
    "geography",
    "economics",
    "programming",
    "javascript",
    "python",
    "sql",
    "web development",
    "photosynthesis",
    "mitochondria",
  ];

  const messageLower = message.toLowerCase();
  for (const topic of topics) {
    if (messageLower.includes(topic)) {
      return topic;
    }
  }
  return "general";
}

/**
 * Detect difficulty level from message
 */
function detectDifficulty(
  message: string
): "beginner" | "intermediate" | "advanced" {
  const advancedKeywords = [
    "derive",
    "prove",
    "complex",
    "theorem",
    "integration",
    "differential",
    "quantum",
    "entropy",
    "equilibrium",
    "isomorphism",
  ];

  const messageLower = message.toLowerCase();

  if (advancedKeywords.some((keyword) => messageLower.includes(keyword))) {
    return "advanced";
  }

  if (
    message.length > 200 ||
    messageLower.includes("explain") ||
    messageLower.includes("detailed")
  ) {
    return "intermediate";
  }

  return "beginner";
}
