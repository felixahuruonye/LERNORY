// OpenAI integration blueprint reference: javascript_openai
import OpenAI from "openai";
import fs from "fs";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function chatWithAI(messages: Array<{role: string; content: string}>): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: messages as any,
    max_completion_tokens: 4096,
  });

  return response.choices[0].message.content || "";
}

export async function generateLesson(transcriptText: string): Promise<any> {
  const response = await openai.chat.completions.create({
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
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

export async function generateSyllabus(topic: string): Promise<any> {
  const response = await openai.chat.completions.create({
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
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

export async function gradeQuiz(answers: any, rubric: any): Promise<any> {
  const response = await openai.chat.completions.create({
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
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

export async function transcribeAudio(audioFilePath: string): Promise<{ text: string, duration: number }> {
  const audioReadStream = fs.createReadStream(audioFilePath);

  const transcription = await openai.audio.transcriptions.create({
    file: audioReadStream,
    model: "whisper-1",
  });

  return {
    text: transcription.text,
    duration: 0,
  };
}

export async function generateSpeech(text: string): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: text,
  });

  return Buffer.from(await response.arrayBuffer());
}

export async function summarizeText(text: string, length: 'short' | 'medium' | 'long' = 'medium'): Promise<string> {
  const lengthInstructions = {
    short: "in 2-3 sentences",
    medium: "in 1-2 paragraphs",
    long: "in detail with multiple paragraphs"
  };

  const prompt = `Please summarize the following text ${lengthInstructions[length]}:\n\n${text}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content || "";
}

export async function generateFlashcards(text: string): Promise<any> {
  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "You are an expert at creating study flashcards. Generate flashcards from the provided text. Respond with JSON in this format: { 'flashcards': [{ 'front': string, 'back': string }] }",
      },
      {
        role: "user",
        content: `Create flashcards from this content:\n\n${text}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}
