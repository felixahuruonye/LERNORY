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

    console.log("LEARNORY: Generating image with DALL-E for:", prompt);
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
    });

    if (!response?.data?.[0]?.url) {
      throw new Error("No image URL in response from DALL-E");
    }

    console.log("✅ Image generated successfully");
    return {
      url: response.data[0].url,
      prompt
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error generating image with DALL-E:", errorMsg);
    throw error;
  }
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
