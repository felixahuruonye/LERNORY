// Gemini AI integration blueprint reference: javascript_gemini
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface GeneratedWebsite {
  html: string;
  css: string;
  js: string;
  title: string;
}

interface SearchResult {
  title: string;
  snippet: string;
  link: string;
  source: string;
}

interface WebSearchResponse {
  results: SearchResult[];
  summary: string;
}

// Generate exam questions with LEARNORY (Gemini AI) - Real questions per subject
export async function generateQuestionsWithLEARNORY(
  examType: string,
  subject: string,
  count: number = 50
): Promise<
  Array<{ id: string; question: string; options: string[]; correct: string; explanation: string }>
> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const actualCount = Math.min(count, 50); // Cap at 50 for faster generation
    console.log(`📚 LEARNORY generating ${actualCount} ${subject} questions for ${examType}...`);

    // Specific prompts for each exam type and subject to ensure accurate questions
    const subjectPrompts: Record<string, string> = {
      Mathematics: `Generate ${actualCount} authentic ${examType} Mathematics exam questions. Include algebra, geometry, calculus, and trigonometry topics. Each question must be realistic and appear on actual ${examType} exams.`,
      English: `Generate ${actualCount} authentic ${examType} English exam questions. Include reading comprehension, grammar, vocabulary, and literature topics. Each question must be realistic and appear on actual ${examType} exams.`,
      Physics: `Generate ${actualCount} authentic ${examType} Physics exam questions. Include mechanics, electricity, waves, and thermodynamics. Each question must be realistic and appear on actual ${examType} exams.`,
      Chemistry: `Generate ${actualCount} authentic ${examType} Chemistry exam questions. Include organic chemistry, inorganic chemistry, physical chemistry. Each question must be realistic and appear on actual ${examType} exams.`,
      Biology: `Generate ${actualCount} authentic ${examType} Biology exam questions. Include cell biology, genetics, evolution, ecology, and human physiology. Each question must be realistic and appear on actual ${examType} exams.`,
      'Reading and Writing': `Generate ${actualCount} authentic ${examType} Reading and Writing exam questions.`,
      'Verbal Reasoning': `Generate ${actualCount} authentic ${examType} Verbal Reasoning exam questions.`,
      'Quantitative Reasoning': `Generate ${actualCount} authentic ${examType} Quantitative Reasoning exam questions.`,
      Math: `Generate ${actualCount} authentic ${examType} Math exam questions.`,
    };

    const subjectPrompt = subjectPrompts[subject] || `Generate ${actualCount} authentic ${examType} ${subject} exam questions.`;

    const prompt = `You are an expert ${examType} exam question generator specializing in ${subject}. ${subjectPrompt}

Generate exactly ${actualCount} questions in this EXACT JSON format only:
[
  {"id": "1", "question": "Question text?", "options": ["Option A", "Option B", "Option C", "Option D"], "correct": "A", "explanation": "Why A is correct..."},
  {"id": "2", "question": "Another question?", "options": ["Option A", "Option B", "Option C", "Option D"], "correct": "B", "explanation": "Explanation..."}
]

STRICT REQUIREMENTS:
- ONLY output the JSON array, nothing else
- Each question MUST have exactly 4 options
- Correct answer MUST be A, B, C, or D
- ID must be incrementing numbers as strings
- Include detailed explanations
- Make questions realistic for actual ${examType} exams`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let responseText = response.text;
    console.log(`[DEBUG] Raw response length: ${responseText?.length}, first 100 chars:`, responseText?.substring(0, 100));
    
    if (!responseText) throw new Error("Empty response from LEARNORY");

    // Extract JSON from markdown code blocks or direct JSON
    let jsonText = responseText;
    
    // First try markdown code blocks (```json ... ```)
    const markdownMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
      jsonText = markdownMatch[1];
      console.log(`[DEBUG] Extracted from markdown, length: ${jsonText.length}`);
    }

    // Try to find JSON array
    const arrayMatch = jsonText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!arrayMatch) {
      throw new Error("Could not extract JSON array from LEARNORY response");
    }

    const questionsData = JSON.parse(arrayMatch[0]);
    
    if (!Array.isArray(questionsData)) {
      throw new Error("LEARNORY response is not an array");
    }

    // Validate and fix question structure
    const validQuestions = questionsData.map((q: any, idx: number) => ({
      id: String(idx + 1),
      question: q.question || `Question ${idx + 1}`,
      options: q.options && Array.isArray(q.options) ? q.options : ["A", "B", "C", "D"],
      correct: (q.correct || "A").toUpperCase(),
      explanation: q.explanation || "See textbook for explanation."
    })).filter(q => q.question && q.options.length === 4);

    console.log(`✅ LEARNORY generated ${validQuestions.length} validated questions for ${subject}`);

    if (validQuestions.length === 0) {
      throw new Error("No valid questions generated from LEARNORY");
    }

    return validQuestions;
  } catch (error) {
    console.error(`❌ LEARNORY error for ${subject}:`, error);
    throw error;
  }
}

// Grade answers with LEARNORY (Gemini AI) - Provides AI-powered analysis and explanations
export async function gradeAnswersWithLEARNORY(
  questions: Array<{ id: string; question: string; options: string[]; correct: string; explanation?: string }>,
  answers: Record<string, string>
): Promise<{
  score: number;
  detailedFeedback: Array<{ questionId: string; isCorrect: boolean; explanation: string; keyLearning: string }>;
  summary: string;
  strongTopics: string[];
  weakTopics: string[];
  recommendations: string[];
}> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const questionsData = questions
      .map((q, idx) => ({
        number: idx + 1,
        question: q.question,
        options: q.options,
        correct: q.correct,
        userAnswer: answers[q.id] || 'Not answered',
        isCorrect: answers[q.id] === q.correct,
        explanation: q.explanation || '',
      }))
      .map((q) => JSON.stringify(q))
      .join('\n\n');

    const prompt = `You are LEARNORY - an expert educational AI tutor. Grade these exam answers and provide detailed, personalized feedback.

QUESTIONS AND ANSWERS:
${questionsData}

Analyze the answers and return ONLY valid JSON (no other text):
{
  "score": 75,
  "detailedFeedback": [
    {"questionId": "1", "isCorrect": true, "explanation": "Well done...", "keyLearning": "Key insight..."},
    {"questionId": "2", "isCorrect": false, "explanation": "The correct answer is...", "keyLearning": "Important concept..."}
  ],
  "summary": "Overall performance summary with personalized insights from LEARNORY",
  "strongTopics": ["Topic 1", "Topic 2"],
  "weakTopics": ["Topic 3"],
  "recommendations": ["Study recommendation 1", "Study recommendation 2", "Study recommendation 3"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Empty grading response");

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not extract JSON from LEARNORY grading");

    const gradingData = JSON.parse(jsonMatch[0]);
    console.log(`✅ LEARNORY grading complete: ${gradingData.score}%`);

    return gradingData;
  } catch (error) {
    console.error("LEARNORY grading error:", error);
    throw error;
  }
}

// Internet search with Gemini (returns web search results with sources)
export async function searchInternetWithGemini(query: string): Promise<WebSearchResponse> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    console.log("🔍 Searching internet for:", query);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a web search assistant. Search for information about: "${query}"

Return ONLY valid JSON (no other text):
{
  "results": [
    {"title": "Result Title", "snippet": "Brief description", "link": "https://example.com", "source": "Website Name"},
    {"title": "Another Result", "snippet": "Description", "link": "https://example2.com", "source": "Website Name 2"}
  ],
  "summary": "Brief summary of search results"
}

Find real, recent information. Include sources and links.`
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Empty search response");

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not extract JSON from search response");

    const searchData = JSON.parse(jsonMatch[0]);
    console.log(`✅ Found ${searchData.results?.length || 0} results`);

    return {
      results: searchData.results || [],
      summary: searchData.summary || "Search completed"
    };
  } catch (error) {
    console.error("Internet search error:", error);
    return {
      results: [],
      summary: "Unable to search internet. Try again later."
    };
  }
}

export async function generateWebsiteWithGemini(prompt: string): Promise<GeneratedWebsite> {
  const fullPrompt = `You are a web developer. Create a website based on this description: ${prompt}

Response format (ONLY output valid JSON, no other text):
{
  "title": "Website Name",
  "html": "<html><head><title>Web</title></head><body>Content</body></html>",
  "css": "body { margin: 0; padding: 20px; }",
  "js": ""
}`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    console.log("Calling LEARNORY AI with prompt length:", prompt.length);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });

    console.log("LEARNORY AI response received, extracting text...");
    
    const responseText = response.text;
    
    if (!responseText) {
      console.error("Empty response from LEARNORY AI");
      throw new Error("Empty response from LEARNORY AI");
    }
    
    console.log("Response text length:", responseText.length);
    console.log("Response text preview:", responseText.substring(0, 200));
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not extract JSON from response:", responseText.substring(0, 500));
      throw new Error(`Failed to extract JSON from LEARNORY AI response`);
    }

    console.log("JSON extracted, parsing...");
    const generatedData = JSON.parse(jsonMatch[0]);
    console.log("JSON parsed successfully, generated data keys:", Object.keys(generatedData));

    return {
      title: generatedData.title || "Generated Website",
      html: generatedData.html || "<h1>Error generating HTML</h1>",
      css: generatedData.css || "",
      js: generatedData.js || "",
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error generating website with LEARNORY AI:", errorMsg);
    throw error;
  }
}

export async function explainCodeForBeginners(html: string, css: string, js: string): Promise<string> {
  const codeSnippet = `HTML:\n${html}\n\nCSS:\n${css}\n\nJavaScript:\n${js}`;
  
  const prompt = `I am a complete beginner learning web development. Please explain this code to me in very simple, easy-to-understand language. Explain what each part does, why it's written that way, and how it works together. Use analogies and simple examples if needed.

Code to explain:
${codeSnippet}

Explain it like you're teaching someone who has never written code before. Be detailed but simple.`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    console.log("Calling LEARNORY AI to explain code...");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    console.log("LEARNORY AI response received for code explanation");
    
    const explanation = response.text;
    
    if (!explanation) {
      throw new Error("Empty response from LEARNORY AI");
    }

    return explanation;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error explaining code with LEARNORY AI:", errorMsg);
    throw error;
  }
}

interface DebugResult {
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  steps: string[];
}

export async function debugCodeWithLEARNORY(html: string, css: string, js: string, debugPrompt: string): Promise<DebugResult> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not set");
    }

    const prompt = `You are an expert web developer. The user's request: "${debugPrompt}"

Current HTML code:
${html}

CSS:
${css}

JavaScript:
${js}

Analyze the request and provide ONLY a raw JSON response with NO markdown, NO code blocks, NO explanation - just pure JSON:
{
  "htmlCode": "<the complete fixed HTML with all improvements>",
  "cssCode": "<the complete fixed CSS>",
  "jsCode": "<the complete fixed JavaScript or empty string>",
  "steps": ["fix 1", "fix 2"]
}`;

    console.log("🔄 Calling Gemini API for debug...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let responseText = (response.text || "").trim();
    if (!responseText) throw new Error("Empty response from Gemini");

    console.log("📝 Raw Gemini response (first 300 chars):", responseText.substring(0, 300));

    // Aggressively clean markdown
    responseText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .replace(/^\s*```/gm, "")
      .replace(/```\s*$/gm, "")
      .trim();

    // Find JSON object
    const jsonStart = responseText.indexOf("{");
    const jsonEnd = responseText.lastIndexOf("}");
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("No JSON object found in response");
    }

    const jsonStr = responseText.substring(jsonStart, jsonEnd + 1);
    console.log("✅ Extracted JSON, parsing...");

    const result = JSON.parse(jsonStr);

    return {
      htmlCode: result.htmlCode || html,
      cssCode: result.cssCode || css,
      jsCode: result.jsCode || js,
      steps: Array.isArray(result.steps) ? result.steps : []
    };
  } catch (error) {
    console.error("❌ Gemini debug failed:", error);
    throw error;
  }
}

interface TopicExplanationResult {
  explanation: string;
  examples: string[];
  relatedTopics: string[];
}

export async function explainTopicWithLEARNORY(subject: string, topic: string, difficulty: string = "medium"): Promise<TopicExplanationResult> {
  const prompt = `Explain the topic "${topic}" in ${subject} at ${difficulty} level.

Format: {"explanation": "...", "examples": ["ex1", "ex2"], "relatedTopics": ["topic1", "topic2"]}`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Empty response");

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not extract JSON");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error explaining topic:", error);
    throw error;
  }
}

interface ImageGenerationResult {
  url: string;
  prompt: string;
}

export async function generateImageWithLEARNORY(prompt: string): Promise<ImageGenerationResult> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    console.log("🎨 LEARNORY: Generating image with Stability AI for:", prompt);
    
    // Use Gemini to enhance and refine the image prompt
    const enhancedPromptResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert image prompt engineer. Take this simple image description and expand it into a detailed, vivid, and specific image prompt for Stability AI.

Original prompt: "${prompt}"

Provide ONLY the enhanced prompt without any additional text or explanation.`,
    });

    const enhancedPrompt = enhancedPromptResponse.text?.trim() || prompt;
    console.log("✅ Enhanced prompt:", enhancedPrompt);

    // Try to generate with Stability AI, fallback to placeholder if API key missing
    let imageUrl = "";
    
    if (process.env.STABILITY_API_KEY) {
      try {
        imageUrl = await generateImageWithStabilityAI(enhancedPrompt);
        console.log("✅ Image generated with Stability AI");
      } catch (stabilityError) {
        console.warn("Stability AI generation failed, using placeholder:", stabilityError);
        imageUrl = generatePlaceholderImage(prompt);
      }
    } else {
      console.warn("STABILITY_API_KEY not set, using placeholder image");
      imageUrl = generatePlaceholderImage(prompt);
    }

    return {
      url: imageUrl,
      prompt: enhancedPrompt
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error generating image with Gemini:", errorMsg);
    throw error;
  }
}

async function generateImageWithStabilityAI(prompt: string): Promise<string> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) throw new Error("STABILITY_API_KEY not configured");

  try {
    // Truncate prompt to 2000 characters (Stability AI limit)
    const truncatedPrompt = prompt.length > 2000 ? prompt.substring(0, 2000) : prompt;
    console.log(`📝 Prompt length: ${truncatedPrompt.length}/2000 chars`);

    const response = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text_prompts: [{ text: truncatedPrompt, weight: 1 }],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 30,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stability AI error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as any;
    const base64Image = data.artifacts?.[0]?.base64;
    
    if (!base64Image) throw new Error("No image data in response");

    const imageUrl = `data:image/png;base64,${base64Image}`;
    console.log("✅ Stability AI image generated successfully");
    return imageUrl;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Stability AI error:", errorMsg);
    throw error;
  }
}

function generatePlaceholderImage(prompt: string): string {
  const colors = generateColorPaletteFromPrompt(prompt);
  const bgColor = colors[0].replace('#', '');
  const accentColor = colors[1].replace('#', '');
  const shortPrompt = prompt.substring(0, 25).replace(/\s+/g, '+');
  return `https://via.placeholder.com/1024x1024/${bgColor}/${accentColor}.png?text=${encodeURIComponent(shortPrompt)}`;
}

function generateColorPaletteFromPrompt(prompt: string): [string, string, string] {
  // Generate colors based on prompt keywords
  const lowerPrompt = prompt.toLowerCase();
  
  const colorMaps: Record<string, [string, string, string]> = {
    'sunset': ['#FF6B6B', '#FFA94D', '#FFD93D'],
    'ocean': ['#1E90FF', '#00BFFF', '#87CEEB'],
    'forest': ['#2D5016', '#3D7D3D', '#7ECA82'],
    'night': ['#0B1929', '#2D4059', '#EA5455'],
    'fire': ['#FF4500', '#FF8C00', '#FFD700'],
    'space': ['#0B1F35', '#090C9B', '#30127D'],
    'flower': ['#FF1493', '#FF69B4', '#FFB6C1'],
    'mountain': ['#8B7355', '#A0826D', '#BFA68F'],
  };

  for (const [key, colors] of Object.entries(colorMaps)) {
    if (lowerPrompt.includes(key)) {
      return colors;
    }
  }

  // Default gradient palette
  return ['#667eea', '#764ba2', '#f093fb'];
}

export async function chatWithGemini(messages: Array<{ role: string; content: string }>): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      })) as any
    });

    const result = response.text;
    if (!result) {
      throw new Error("Empty response from Gemini");
    }
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error chatting with Gemini:", errorMsg);
    throw error;
  }
}

export async function generateSmartChatTitle(messages: Array<{ role: string; content: string }>): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    const conversationSnippet = messages
      .slice(0, 4)
      .map(m => `${m.role}: ${m.content.substring(0, 100)}`)
      .join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a brief, descriptive title (max 6 words) for this conversation:

${conversationSnippet}

Respond with ONLY the title, no quotes or extra text.`
    });

    const title = response.text?.trim() || "Chat";
    return title.substring(0, 50);
  } catch (error) {
    console.error("Error generating title:", error);
    return "Chat";
  }
}

export async function analyzeFileWithGeminiVision(buffer: Buffer, mimeType: string, fileName: string): Promise<{ extractedText: string }> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    const base64Data = buffer.toString('base64');
    console.log(`📄 Analyzing file with Gemini Vision: ${fileName}`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "application/octet-stream",
            data: base64Data
          }
        },
        {
          text: "Extract and return all text content from this file. If it's an image, describe the content. If it's a PDF or document, extract the text."
        }
      ] as any
    });

    const extractedText = response.text || "";
    console.log(`✅ Extracted ${extractedText.length} characters`);

    return { extractedText };
  } catch (error) {
    console.error("Gemini Vision analysis error:", error);
    return { extractedText: "" };
  }
}

interface GeneratedLessonData {
  title: string;
  objectives: string[];
  keyPoints: string[];
  summary: string;
}

export async function fixTextWithLEARNORY(text: string): Promise<{ correctedText: string; explanation: string }> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    console.log("🔧 Fixing text with LEARNORY AI...");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Fix spelling, grammar, and formatting errors in this text. Respond with ONLY valid JSON (no other text):

{"correctedText": "the fixed text here", "explanation": "brief list of corrections made"}

TEXT TO FIX:
${text}`,
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Empty response");

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not extract JSON");

    const result = JSON.parse(jsonMatch[0]);
    console.log("✅ Text fixed successfully");
    return result;
  } catch (error) {
    console.error("Error fixing text:", error);
    throw error;
  }
}

export async function generateLessonFromTextWithGemini(text: string): Promise<GeneratedLessonData> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    console.log("🎓 Generating lesson from text with Gemini...");

    const prompt = `You are an expert educational content creator. Analyze the following text and create a structured lesson.

Text to analyze:
${text}

Generate ONLY valid JSON (no other text, no markdown):
{
  "title": "Lesson Title (concise, max 10 words)",
  "objectives": ["Objective 1", "Objective 2", "Objective 3"],
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"],
  "summary": "A comprehensive summary of the entire lesson (2-3 sentences)"
}

Make the objectives, key points, and summary educational, clear, and useful for students.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini");
    }

    console.log("📝 Raw Gemini response (first 300 chars):", responseText.substring(0, 300));

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from Gemini response");
    }

    const lessonData = JSON.parse(jsonMatch[0]);
    console.log("✅ Lesson generated successfully");

    return {
      title: lessonData.title || "Generated Lesson",
      objectives: Array.isArray(lessonData.objectives) ? lessonData.objectives : [],
      keyPoints: Array.isArray(lessonData.keyPoints) ? lessonData.keyPoints : [],
      summary: lessonData.summary || "",
    };
  } catch (error) {
    console.error("❌ Error generating lesson from text:", error);
    throw error;
  }
}
