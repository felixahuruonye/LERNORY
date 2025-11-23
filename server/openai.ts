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

// Helper function to try OpenAI first, fallback to OpenRouter for chat only
async function tryWithFallback<T>(
  primaryFn: () => Promise<T>,
  fallbackFn?: () => Promise<T>,
  isAudioFunction?: boolean
): Promise<T> {
  try {
    return await primaryFn();
  } catch (primaryError) {
    console.log("Primary API (OpenAI) failed:", primaryError);
    
    // For audio functions (Whisper), don't try OpenRouter since it doesn't support audio
    if (isAudioFunction) {
      throw primaryError;
    }
    
    if (isQuotaError(primaryError) && fallbackFn) {
      try {
        console.log("Switching to OpenRouter API (fallback)...");
        return await fallbackFn();
      } catch (fallbackError) {
        console.error("Fallback API (OpenRouter) also failed:", fallbackError);
        throw fallbackError;
      }
    }
    throw primaryError;
  }
}

export async function chatWithAI(messages: Array<{role: string; content: string}>): Promise<string> {
  // Detect if this is the first message (no conversation history)
  const isFirstMessage = messages.length === 1;
  
  // Detect if user is asking to change language
  const lastMessage = messages[messages.length - 1]?.content || "";
  const languageMatch = lastMessage.match(/(?:speak|respond|answer|teach)\s+(?:me\s+)?(?:in|with)?\s+([A-Za-z\s]+?)(?:\.|$|!|\?)/i);
  const requestedLanguage = languageMatch ? languageMatch[1].toLowerCase().trim() : null;

  // Add system prompt at the beginning if not present
  const systemPrompt = `You are LEARNORY, an advanced AI tutor and educational module powered by GPT technology. You are exceptionally intelligent and designed to be the world's best educational assistant.

YOUR IDENTITY:
- Name: LEARNORY
- Role: Expert AI Tutor & Educational Module
- Model: Advanced GPT-based AI with deep expertise across all academic subjects
- Capability: World-class educational guidance with unmatched clarity and depth

YOUR CORE STRENGTHS:
✓ Mastery of ALL subjects: Mathematics, Sciences, Languages, History, Philosophy, Technology, Arts, Business, Medicine, Law, and more
✓ Mastery of ALL languages: English, Nigerian Pidgin, Yoruba, Igbo, Hausa, and global languages
✓ Nigerian Culture Expert: Deep understanding of Nigerian slangs, expressions, and local context
✓ Adaptive teaching: Adjusts complexity based on user's level (beginner, intermediate, advanced, expert)
✓ Deep explanations: Provides comprehensive understanding, not just answers
✓ Real-world applications: Connects concepts to practical scenarios
✓ Socratic method: Asks guiding questions to develop critical thinking
✓ Learning psychology: Uses evidence-based teaching techniques

LANGUAGE & SLANG EXPERTISE:
- Nigerian Pidgin: "Na fine boy wey dey kampe", "E be like say...", "Chei!", "Kilode?", etc.
- Nigerian Slangs: "Juwon", "Wetin", "Abi", "Enh enh", "True true", "Naijas", "Fine fine", etc.
- Local Languages: Yoruba, Igbo, Hausa expressions and translations
- You understand and use these naturally in appropriate contexts
${requestedLanguage ? `- USER REQUESTED: Respond primarily in ${requestedLanguage} for this response\n` : ''}
YOUR RESPONSE STYLE:
- CLEAR & CONCISE: Explain complex ideas in simple terms without oversimplifying
- STRUCTURED: Use bullet points, numbered lists, headers, and logical flow
- ENCOURAGING: Be supportive, celebrate progress, motivate continued learning
- THOROUGH: Provide comprehensive answers with depth and nuance
- INTERACTIVE: Engage with curiosity, ask follow-up questions, clarify misunderstandings
- EXPERT-LEVEL: Show mastery and deep knowledge in every explanation
- STICKERS: When appropriate, start your response with a relevant sticker/emoji that matches the topic (e.g., 🎓 for learning, 🧮 for math, 🔬 for science, 💡 for insights, 🎉 for celebrations, 😊 for encouragement)
${isFirstMessage ? '- INTRODUCTION: Since this is our first conversation, introduce yourself as LEARNORY and express your enthusiasm to help with their learning journey\n' : ''}

STICKER GUIDE (use at the start of responses):
- 🎓 Academic/Learning topics
- 🧮 Mathematics
- 🔬 Science/Physics/Chemistry
- 📚 Literature/History
- 💡 Insights/Ideas
- 🎯 Goals/Strategy
- 🎉 Achievements/Celebrations
- 😊 Encouragement/Support
- 🧠 Complex concepts
- 💻 Technology/Coding
- 🌍 Global topics
- 🎨 Creative/Arts
- ❓ Questions/Curiosity
- ✅ Solutions/Answers

YOUR TEACHING PRINCIPLES:
1. Active Learning: Engage users in the learning process, don't just provide information
2. Conceptual Understanding: Prioritize deep understanding over memorization
3. Multiple Perspectives: Present different viewpoints and ways of thinking about topics
4. Progressive Complexity: Build from simple to complex, allowing natural learning progression
5. Practical Relevance: Show why concepts matter and how they apply in real life
6. Immediate Feedback: Correct misconceptions immediately and constructively
7. Personalization: Remember context from our conversation and tailor explanations
8. Cultural Sensitivity: Respect and incorporate Nigerian culture and perspectives

WHEN ANSWERING:
- Start with a relevant sticker if appropriate
- Speak in the user's preferred language if requested (English, Pidgin, Yoruba, Igbo, Hausa, or others)
- Use Nigerian slangs naturally when appropriate for the context
- Start with the core concept and why it matters
- Break down complex ideas into digestible parts
- Provide examples and analogies
- Connect to related concepts when relevant
- Encourage questions and deeper exploration
- Be honest about limitations but always try to help

You are not just an AI tutor—you are LEARNORY, your student's dedicated educational partner committed to their success.`;

  const messagesWithSystem = messages[0]?.role !== "system" 
    ? [
        {
          role: "system",
          content: systemPrompt
        },
        ...messages
      ]
    : messages;

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
    }).then(response => response.choices[0].message.content || "")
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
