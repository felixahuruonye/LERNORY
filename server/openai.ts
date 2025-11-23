// OpenAI integration blueprint reference: javascript_openai
import OpenAI from "openai";
import fs from "fs";

// Initialize OpenAI client (primary)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize OpenRouter client (fallback)
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

// Helper function to try OpenAI first, fallback to OpenRouter
async function tryWithFallback<T>(
  primaryFn: () => Promise<T>,
  fallbackFn?: () => Promise<T>
): Promise<T> {
  try {
    return await primaryFn();
  } catch (primaryError) {
    console.log("Primary API (OpenAI) failed:", primaryError);
    
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
  return tryWithFallback(
    () => openai.chat.completions.create({
      model: "gpt-5",
      messages: messages as any,
      max_completion_tokens: 4096,
    }).then(response => response.choices[0].message.content || ""),
    
    () => openrouter.chat.completions.create({
      model: "openai/gpt-4-turbo",
      messages: messages as any,
      max_tokens: 4096,
    }).then(response => response.choices[0].message.content || "")
  );
}

export async function generateLesson(transcriptText: string): Promise<any> {
  return tryWithFallback(
    () => openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator. Convert transcripts into structured lessons with title, objectives, key points, and summary. Respond with JSON in this format: { 'title': string, 'objectives': string[], 'keyPoints': string[], 'summary': string }",
        },
        {
          role: "user",
          content: `Convert this transcript into a structured lesson:\n\n${transcriptText}`,
        },
      ],
      response_format: { type: "json_object" },
    }).then(response => JSON.parse(response.choices[0].message.content || "{}")),
    
    () => openrouter.chat.completions.create({
      model: "openai/gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator. Convert transcripts into structured lessons with title, objectives, key points, and summary. Respond with JSON in this format: { 'title': string, 'objectives': string[], 'keyPoints': string[], 'summary': string }",
        },
        {
          role: "user",
          content: `Convert this transcript into a structured lesson:\n\n${transcriptText}`,
        },
      ],
    }).then(response => JSON.parse(response.choices[0].message.content || "{}"))
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
  return tryWithFallback(
    async () => {
      const audioReadStream = fs.createReadStream(audioFilePath);
      const transcription = await openai.audio.transcriptions.create({
        file: audioReadStream,
        model: "whisper-1",
      });
      return {
        text: transcription.text,
        duration: 0,
      };
    },
    
    async () => {
      const audioReadStream = fs.createReadStream(audioFilePath);
      const transcription = await openrouter.audio.transcriptions.create({
        file: audioReadStream,
        model: "openai/whisper-1",
      });
      return {
        text: transcription.text,
        duration: 0,
      };
    }
  );
}

export async function generateSpeech(text: string): Promise<Buffer> {
  return tryWithFallback(
    () => openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    }).then(response => Buffer.from(response as any)),
    
    () => openrouter.audio.speech.create({
      model: "openai/tts-1",
      voice: "alloy",
      input: text,
    }).then(response => Buffer.from(response as any))
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
    }).then(response => JSON.parse(response.choices[0].message.content || "{}"))
  );
}
