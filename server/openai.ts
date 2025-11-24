// OpenAI integration blueprint reference: javascript_openai
import OpenAI from "openai";
import fs from "fs";

// Initialize OpenAI client (primary)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize OpenRouter client (fallback) - NOT used for audio/whisper
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// Helper function to check if error is quota-related
function isQuotaError(error: any): boolean {
  return (
    error?.status === 429 ||
    error?.code === "insufficient_quota" ||
    error?.code === "rate_limit_exceeded" ||
    error?.message?.includes("quota") ||
    error?.message?.includes("exceeded")
  );
}

// Helper function to try OpenAI first, fallback to OpenRouter, then Gemini for chat
async function tryWithFallback<T>(
  primaryFn: () => Promise<T>,
  fallbackFn?: () => Promise<T>,
  geminiFunction?: () => Promise<T>,
  isAudioFunction?: boolean
): Promise<T> {
  try {
    console.log("Trying primary API (OpenAI)...");
    return await primaryFn();
  } catch (primaryError) {
    console.error("Primary API (OpenAI) failed:", primaryError instanceof Error ? primaryError.message : primaryError);
    
    // For audio functions (Whisper), don't try other APIs since they don't support audio
    if (isAudioFunction) {
      throw primaryError;
    }
    
    // Try fallback (OpenRouter)
    if (fallbackFn) {
      try {
        console.log("Switching to OpenRouter API (fallback)...");
        return await fallbackFn();
      } catch (fallbackError) {
        console.error("OpenRouter API also failed:", fallbackError instanceof Error ? fallbackError.message : fallbackError);
        
        // Try Gemini as final fallback
        if (geminiFunction) {
          try {
            console.log("Switching to Gemini API (final fallback)...");
            return await geminiFunction();
          } catch (geminiError) {
            console.error("Gemini API also failed:", geminiError instanceof Error ? geminiError.message : geminiError);
            throw geminiError;
          }
        }
        throw fallbackError;
      }
    }
    throw primaryError;
  }
}

export async function chatWithAI(messages: Array<{role: string; content: string}>): Promise<string> {
  // Import LEARNORY Ultra-Advanced System
  const { generateLEARNORYSystemPrompt } = await import("./learnorySystem");
  
  // Detect language and mode
  const lastMessage = messages[messages.length - 1]?.content || "";
  const languageMatch = lastMessage.match(/(?:speak|respond|answer|teach)\s+(?:me\s+)?(?:in|with)?\s+([A-Za-z\s]+?)(?:\.|$|!|\?)/i);
  const requestedLanguage = languageMatch ? languageMatch[1].toLowerCase().trim() : null;
  
  const modeMatch = lastMessage.match(/\[MODE:\s*(learning|exam|revision|quick|eli5|advanced|practice)\]/i);
  const requestedMode = modeMatch ? modeMatch[1].toLowerCase() : 'learning';
  
  // Detect subject from message
  const subjectKeywords = {
    mathematics: ["math", "algebra", "calculus", "geometry", "equation", "formula"],
    physics: ["physics", "force", "motion", "energy", "wave", "velocity"],
    chemistry: ["chemistry", "reaction", "element", "molecule", "bond", "compound"],
    biology: ["biology", "cell", "organism", "dna", "gene", "photosynthesis"],
    english: ["english", "grammar", "essay", "literature", "writing"],
    government: ["government", "constitution", "politics", "civic"],
  };
  
  let detectedSubject = "general";
  const messageText = lastMessage.toLowerCase();
  for (const [subject, keywords] of Object.entries(subjectKeywords)) {
    if (keywords.some(kw => messageText.includes(kw))) {
      detectedSubject = subject;
      break;
    }
  }

  // Generate comprehensive LEARNORY Ultra-Advanced system prompt
  const systemPrompt = generateLEARNORYSystemPrompt({
    subject: detectedSubject,
    userLevel: "intermediate",
    weakTopics: [],
    examType: "jamb",
    daysUntilExam: 30,
    currentStreak: 0,
    averageScore: 0,
  });

  const messagesWithSystem = messages[0]?.role !== "system" 
    ? [
        {
          role: "system",
          content: systemPrompt
        },
        ...messages
      ]
    : messages;

  try {
    console.log("Trying OpenAI API...");
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messagesWithSystem as any,
      max_tokens: 1500,
      temperature: 0.8,
    });
    const result = response.choices[0].message.content || "";
    console.log("✓ OpenAI succeeded");
    return result;
  } catch (error1) {
    console.error("✗ OpenAI failed:", error1 instanceof Error ? error1.message : error1);
    
    try {
      console.log("Trying OpenRouter API...");
      const response = await openrouter.chat.completions.create({
        model: "meta-llama/llama-3-8b-instruct",
        messages: messagesWithSystem as any,
        max_tokens: 1200,
        temperature: 0.8,
      });
      const result = response.choices[0].message.content || "";
      console.log("✓ OpenRouter succeeded");
      return result;
    } catch (error2) {
      console.error("✗ OpenRouter failed:", error2 instanceof Error ? error2.message : error2);
      
      try {
        console.log("Trying Gemini API...");
        const { chatWithGemini } = await import("./gemini");
        const result = await chatWithGemini(messages);
        console.log("✓ Gemini succeeded");
        return result;
      } catch (error3) {
        console.error("✗ Gemini failed:", error3 instanceof Error ? error3.message : error3);
        throw new Error("All AI APIs failed. Please try again later.");
      }
    }
  }
}

export async function generateLesson(transcriptText: string): Promise<any> {
  return tryWithFallback(
    () => openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Create a lesson from the transcript. Respond with: TITLE: [title]\nOBJECTIVES: [list]\nKEY_POINTS: [list]\nSUMMARY: [summary]",
        },
        {
          role: "user",
          content: `Convert this transcript into a lesson:\n\n${transcriptText.slice(0, 1000)}`,
        },
      ],
      max_tokens: 800,
    }).then(response => {
      const text = response.choices[0].message.content || "";
      const titleMatch = text.match(/TITLE:\s*(.+?)(?:\n|$)/);
      const objMatch = text.match(/OBJECTIVES:\s*(.+?)(?:\nKEY|$)/);
      const keyMatch = text.match(/KEY_POINTS:\s*(.+?)(?:\nSUMMARY|$)/);
      const sumMatch = text.match(/SUMMARY:\s*([\s\S]*?)$/);
      
      return {
        title: titleMatch ? titleMatch[1].trim() : "Untitled Lesson",
        objectives: objMatch ? objMatch[1].split(',').map(o => o.trim()) : [],
        keyPoints: keyMatch ? keyMatch[1].split(',').map(k => k.trim()) : [],
        summary: sumMatch ? sumMatch[1].trim() : "",
      };
    }),
    
    () => openrouter.chat.completions.create({
      model: "meta-llama/llama-3-8b-instruct",
      messages: [
        {
          role: "system",
          content: "Create a lesson from the transcript. Respond with: TITLE: [title]\nOBJECTIVES: [list]\nKEY_POINTS: [list]\nSUMMARY: [summary]",
        },
        {
          role: "user",
          content: `Convert this transcript into a lesson:\n\n${transcriptText.slice(0, 800)}`,
        },
      ],
      max_tokens: 600,
    }).then(response => {
      const text = response.choices[0].message.content || "";
      const titleMatch = text.match(/TITLE:\s*(.+?)(?:\n|$)/);
      const objMatch = text.match(/OBJECTIVES:\s*(.+?)(?:\nKEY|$)/);
      const keyMatch = text.match(/KEY_POINTS:\s*(.+?)(?:\nSUMMARY|$)/);
      const sumMatch = text.match(/SUMMARY:\s*([\s\S]*?)$/);
      
      return {
        title: titleMatch ? titleMatch[1].trim() : "Untitled Lesson",
        objectives: objMatch ? objMatch[1].split(',').map(o => o.trim()) : [],
        keyPoints: keyMatch ? keyMatch[1].split(',').map(k => k.trim()) : [],
        summary: sumMatch ? sumMatch[1].trim() : "",
      };
    })
  );
}

export async function generateSyllabus(topic: string): Promise<any> {
  return tryWithFallback(
    () => openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert curriculum designer. Generate a comprehensive course syllabus with modules and lessons. Respond with JSON in this format: { 'title': string, 'description': string, 'modules': [{ 'title': string, 'lessons': [{ 'title': string, 'description': string, 'duration': string }] }] }",
        },
        {
          role: "user",
          content: `Create a comprehensive course syllabus for: ${topic}`,
        },
      ],
      response_format: { type: "json_object" },
    }).then(response => JSON.parse(response.choices[0].message.content || "{}")),
    
    () => openrouter.chat.completions.create({
      model: "openai/gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert curriculum designer. Generate a comprehensive course syllabus with modules and lessons. Respond with JSON in this format: { 'title': string, 'description': string, 'modules': [{ 'title': string, 'lessons': [{ 'title': string, 'description': string, 'duration': string }] }] }",
        },
        {
          role: "user",
          content: `Create a comprehensive course syllabus for: ${topic}`,
        },
      ],
    }).then(response => JSON.parse(response.choices[0].message.content || "{}"))
  );
}

export async function gradeQuiz(answers: any, rubric: any): Promise<any> {
  return tryWithFallback(
    () => openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert grader. Evaluate the student's answers according to the rubric and provide detailed feedback. Respond with JSON in this format: { 'score': number, 'totalPoints': number, 'feedback': [{ 'question': number, 'points': number, 'comment': string }] }",
        },
        {
          role: "user",
          content: `Grade these answers:\n\nAnswers: ${JSON.stringify(answers)}\n\nRubric: ${JSON.stringify(rubric)}`,
        },
      ],
      response_format: { type: "json_object" },
    }).then(response => JSON.parse(response.choices[0].message.content || "{}")),
    
    () => openrouter.chat.completions.create({
      model: "openai/gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert grader. Evaluate the student's answers according to the rubric and provide detailed feedback. Respond with JSON in this format: { 'score': number, 'totalPoints': number, 'feedback': [{ 'question': number, 'points': number, 'comment': string }] }",
        },
        {
          role: "user",
          content: `Grade these answers:\n\nAnswers: ${JSON.stringify(answers)}\n\nRubric: ${JSON.stringify(rubric)}`,
        },
      ],
    }).then(response => JSON.parse(response.choices[0].message.content || "{}"))
  );
}

export async function transcribeAudio(audioFilePath: string): Promise<{ text: string, duration: number }> {
  try {
    // OpenAI Whisper only - no fallback for audio
    const audioReadStream = fs.createReadStream(audioFilePath);
    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
    });
    
    return {
      text: transcription.text,
      duration: 0,
    };
  } catch (error: any) {
    console.error("Transcription error with OpenAI:", error);
    
    // If OpenAI quota is exceeded, return a helpful message
    if (isQuotaError(error)) {
      return {
        text: "[Transcription unavailable - OpenAI quota exceeded. Please recharge your OpenAI account at https://platform.openai.com/account/billing/overview]",
        duration: 0,
      };
    }
    
    throw error;
  }
}

export async function generateSpeech(text: string): Promise<Buffer> {
  try {
    console.log("Generating speech with OpenAI...");
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text.slice(0, 4096), // Limit to 4096 chars
    });
    console.log("✓ Speech generated");
    return Buffer.from(response as any);
  } catch (error: any) {
    console.error("OpenAI TTS error:", error?.message);
    // If quota exceeded, throw with helpful message
    if (error?.status === 429 || error?.code === "insufficient_quota") {
      throw new Error("Speech service temporarily unavailable - quota reached. Using text-only mode.");
    }
    throw error;
  }
}

export async function summarizeText(text: string, length: 'short' | 'medium' | 'long' = 'medium'): Promise<string> {
  const lengthInstructions = {
    short: "in 2-3 sentences",
    medium: "in 1-2 paragraphs",
    long: "in detail with multiple paragraphs"
  };

  const prompt = `Please summarize the following text ${lengthInstructions[length]}:\n\n${text}`;

  return tryWithFallback(
    () => openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
    }).then(response => response.choices[0].message.content || ""),
    
    () => openrouter.chat.completions.create({
      model: "openai/gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    }).then(response => response.choices[0].message.content || "")
  );
}

export async function generateFlashcards(text: string): Promise<any> {
  return tryWithFallback(
    () => openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating study flashcards. Generate flashcards from the provided text. Respond with JSON in this format: { 'flashcards': [{ 'front': string, 'back': string }] }",
        },
        {
          role: "user",
          content: `Generate flashcards from this text:\n\n${text}`,
        },
      ],
      response_format: { type: "json_object" },
    }).then(response => JSON.parse(response.choices[0].message.content || "{}")),
    
    () => openrouter.chat.completions.create({
      model: "openai/gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating study flashcards. Generate flashcards from the provided text. Respond with JSON in this format: { 'flashcards': [{ 'front': string, 'back': string }] }",
        },
        {
          role: "user",
          content: `Generate flashcards from this text:\n\n${text}`,
        },
      ],
      max_tokens: 2000,
    }).then(response => JSON.parse(response.choices[0].message.content || "{}"))
  );
}
