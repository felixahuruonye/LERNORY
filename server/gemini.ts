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
    
    // Extract JSON from response (in case there's any surrounding text)
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
  const codeSnippet = `HTML:\n${html}\n\nCSS:\n${css}\n\nJavaScript:\n${js}`;
  
  const prompt = `You are an expert web developer helping someone debug and improve their code. The user wants to: ${debugPrompt}

Current code:
${codeSnippet}

IMPORTANT: Return ONLY valid JSON (no other text) with this structure:
{
  "htmlCode": "updated HTML code here",
  "cssCode": "updated CSS code here",
  "jsCode": "updated JavaScript code here",
  "steps": ["Step 1: description", "Step 2: description", ...]
}

Make the requested changes to the code. The "steps" array should describe what you changed in 2-3 steps.`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    console.log("Calling LEARNORY AI for debugging...");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    console.log("LEARNORY AI debug response received");
    
    const responseText = response.text;
    
    if (!responseText) {
      throw new Error("Empty response from LEARNORY AI");
    }

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not extract JSON from debug response:", responseText.substring(0, 500));
      throw new Error("Failed to extract JSON from LEARNORY AI response");
    }

    const result = JSON.parse(jsonMatch[0]) as DebugResult;
    
    // Validate structure
    if (!result.htmlCode || !result.cssCode || !Array.isArray(result.steps)) {
      throw new Error("Invalid response structure from LEARNORY AI");
    }

    result.jsCode = result.jsCode || "";
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error debugging code with LEARNORY AI:", errorMsg);
    throw error;
  }
}

interface TopicExplanationResult {
  simpleExplanation: string;
  detailedBreakdown: string;
  examples: string[];
  formulas: string[];
  realLifeApplications: string[];
  commonMistakes: string[];
  practiceQuestions: string[];
  imagePrompt: string;
}

export async function explainTopicWithLEARNORY(subject: string, topic: string, difficulty: string = "medium"): Promise<TopicExplanationResult> {
  const prompt = `You are an expert educator. Explain the following topic in a ${difficulty} level way:

Subject: ${subject}
Topic: ${topic}

IMPORTANT: Return ONLY valid JSON (no other text) with this structure:
{
  "simpleExplanation": "A simple explanation that anyone can understand",
  "detailedBreakdown": "A more detailed breakdown with key concepts",
  "examples": ["Example 1", "Example 2", "Example 3"],
  "formulas": ["Formula 1 with LaTeX", "Formula 2"],
  "realLifeApplications": ["Real-life application 1", "Real-life application 2"],
  "commonMistakes": ["Mistake 1 that students make", "Mistake 2"],
  "practiceQuestions": ["Question 1?", "Question 2?"],
  "imagePrompt": "A detailed prompt for generating an illustrative image of this topic"
}

Ensure explanations are clear, with examples and practical applications.`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    console.log("LEARNORY AI: Explaining topic -", subject, topic);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from LEARNORY AI");
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from response");
    }

    const result = JSON.parse(jsonMatch[0]) as TopicExplanationResult;
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error explaining topic with LEARNORY AI:", errorMsg);
    throw error;
  }
}

interface ImageGenerationResult {
  imageUrl: string;
  description: string;
}

export async function generateImageWithLEARNORY(prompt: string): Promise<ImageGenerationResult> {
  // Use Unsplash API for reliable, permanent image URLs
  console.log("LEARNORY AI: Fetching educational image from Unsplash");
  
  try {
    // Extract key terms from prompt for better search
    const searchTerms = prompt.split(' ').slice(0, 2).join('+').toLowerCase();
    const keywords = `${searchTerms},education,learning,science`;
    const unsplashUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(keywords)}`;
    
    console.log("Image URL generated:", unsplashUrl.substring(0, 80));
    return {
      imageUrl: unsplashUrl,
      description: prompt
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error generating image:", errorMsg);
    
    // Fallback: Use a generic Unsplash image that always works
    const fallbackUrl = `https://source.unsplash.com/1024x1024/?learning,education,classroom`;
    return {
      imageUrl: fallbackUrl,
      description: prompt
    };
  }
}
