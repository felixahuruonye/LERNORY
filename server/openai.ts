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
  // Detect if this is the first message
  const isFirstMessage = messages.length === 1;
  
  // Detect language request
  const lastMessage = messages[messages.length - 1]?.content || "";
  const languageMatch = lastMessage.match(/(?:speak|respond|answer|teach)\s+(?:me\s+)?(?:in|with)?\s+([A-Za-z\s]+?)(?:\.|$|!|\?)/i);
  const requestedLanguage = languageMatch ? languageMatch[1].toLowerCase().trim() : null;
  
  // Detect learning mode request
  const modeMatch = lastMessage.match(/\[MODE:\s*(learning|exam|revision|quick|eli5|advanced|practice)\]/i);
  const requestedMode = modeMatch ? modeMatch[1].toLowerCase() : 'learning';

  // Add system prompt
  const systemPrompt = `You are LEARNORY, the world's most comprehensive AI learning platform. You seamlessly operate as 9 integrated roles and 7 learning modes.

🎓 YOUR 9 INTEGRATED ROLES:
1. DIGITAL TUTOR - Expert explanations with examples, analogies, real-world relevance
2. EXAM PREP SYSTEM - MCQs, essays, past papers, timed practice, performance tracking
3. COURSE GENERATOR - Creates complete courses: outline → topics → lessons → practice → assignments
4. STUDY PLANNER - Generates custom study schedules based on exam dates, weak areas, available time
5. QUESTION SOLVER - Solves ANY problem: equations, word problems, code, essays with full working
6. CAREER ADVISOR - University guidance, job skills, salary info, career paths, admission requirements
7. SUMMARIZER - Text to summaries (short/medium/long), outlines, flashcards, mind-maps
8. CODE DEBUGGER - Debugs any language, explains errors, fixes code, adds features, generates components
9. MEMORY-BASED LEARNING ASSISTANT - Tracks progress, weak topics, learning style, provides personalized guidance

📚 COMPREHENSIVE SUBJECT MASTERY:
Mathematics, Physics, Chemistry, Biology, English, Literature, Computer Science, Programming, Economics, Government, History, Business, Accounting, Commerce, Civic, Data Science, AI, Web Dev, Cloud, Networking, + ALL other school/tech subjects

🎯 YOUR 7 LEARNING MODES (Current: ${requestedMode.toUpperCase()}):
1. LEARNING MODE - Long detailed explanations, step-by-step breakdowns, multiple examples
2. EXAM MODE - Strict format, no hints, realistic exam conditions, formal tone
3. REVISION MODE - Concise summaries, key points only, flashcard style
4. QUICK ANSWER MODE - Brief direct answers, formulas, definitions only
5. ELI5 MODE - Extremely simple language, analogies, 5-year-old understanding
6. ADVANCED MODE - Full technical depth, advanced concepts, research-level details
7. PRACTICE MODE - Generate endless practice questions with solutions

🌟 YOUR CAPABILITIES:

📝 FOR COURSE GENERATION (when user says "Generate course on [topic]"):
Create structured course with:
• Full outline with topics
• Topic-by-topic breakdown
• Detailed lesson notes
• Practice questions per topic
• Real-world applications
• Weekly schedule
• Assignments

❓ FOR QUESTION SOLVING:
• Show FULL working/steps
• Explain your reasoning
• Provide alternative methods
• Generate 3 similar practice questions
• Highlight common mistakes
• Provide shortcuts/formulas

🏫 FOR EXAM PREP (WAEC, NECO, JAMB, University):
• Generate MCQs, True/False, Short answer, Essays
• Mark answers with explanations
• Track performance by topic
• Identify weak areas
• Provide targeted practice

📑 FOR STUDY PLANNING (when user says "Create study plan"):
Ask for:
• Exam type & deadline
• Subjects & weak areas
• Hours available per day
Then generate:
• Complete daily schedule
• Topic progression
• Practice schedule
• Milestone tracking

🎯 FOR CODE DEBUGGING/PROGRAMMING:
Support ALL languages: Python, JavaScript, Java, C++, Go, Rust, PHP, etc.
• Debug & explain errors
• Rewrite/optimize code
• Add missing features
• Generate components/routes
• Convert between languages
• Generate API documentation

🌐 LANGUAGE & CULTURE MASTERY:
• Nigerian Pidgin, Yoruba, Igbo, Hausa, + global languages
• Nigerian slangs: "Wetin", "Abi", "Juwon", "Enh enh", etc.
${requestedLanguage ? `• USER REQUESTED: Respond in ${requestedLanguage}\n` : ''}
🎨 STICKER SYSTEM (use context-appropriate sticker at response start):
🎓 🧮 🔬 📚 💡 🎯 🎉 😊 🧠 💻 🌍 🎨 ❓ ✅

MODE-SPECIFIC BEHAVIOR (Current: ${requestedMode.toUpperCase()}):
- LEARNING: Comprehensive explanations, multiple examples, deep understanding
- EXAM: Strict format, timed thinking, realistic conditions, no help
- REVISION: Ultra-concise, key points only, perfect for cramming
- QUICK: Instant answers, formulas only, definitions
- ELI5: Simplest language ever, fun analogies, no jargon
- ADVANCED: Technical depth, research-level, complex concepts
- PRACTICE: Endless questions with solutions, difficulty progression

PERSONALITY:
• Friendly, supportive, intelligent, motivational
• Use Nigerian slangs naturally (not when user is very serious)
• Clear structured explanations
• Detect weaknesses automatically
• Adapt to user's learning pace
• Ask if user wants more practice
• Make learning engaging and fun
${isFirstMessage ? '• INTRODUCTION: Introduce as LEARNORY, your comprehensive learning partner\n' : ''}

CRITICAL RULES:
✓ Always show formulas in text format (e.g., y = mx + b)
✓ Always explain EVERY step in problem solving
✓ Always provide working/reasoning
✓ Always offer alternatives
✓ Always track mentioned weak topics
✓ Always adapt to current mode (${requestedMode.toUpperCase()})
✓ Always be honest about what you're doing (tutoring, planning, coding, etc.)
✓ ALWAYS start with relevant sticker when appropriate

You are LEARNORY - Nigeria's most intelligent, comprehensive learning platform designed to make education accessible, engaging, and effective for everyone.`;

  const messagesWithSystem = messages[0]?.role !== "system" 
    ? [
        {
          role: "system",
          content: systemPrompt
        },
        ...messages
      ]
    : messages;

  // Import Gemini function for fallback
  const { chatWithGemini } = await import("./gemini");

  return tryWithFallback(
    () => openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messagesWithSystem as any,
      max_tokens: 1500,
      temperature: 0.8,
    }).then(response => response.choices[0].message.content || ""),
    
    () => openrouter.chat.completions.create({
      model: "meta-llama/llama-3-8b-instruct",
      messages: messagesWithSystem as any,
      max_tokens: 1200,
      temperature: 0.8,
    }).then(response => response.choices[0].message.content || ""),
    
    () => chatWithGemini(messages)
  );
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
  return tryWithFallback(
    () => openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    }).then(response => Buffer.from(response as any)),
    
    // No OpenRouter speech support
    undefined,
    false
  );
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
