// Gemini AI integration blueprint reference: javascript_gemini
import { GoogleGenAI } from "@google/genai";

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

    console.log("Calling Gemini API with prompt length:", prompt.length);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });

    console.log("Gemini API response received, extracting text...");
    
    const responseText = response.text;
    
    if (!responseText) {
      console.error("Empty response from Gemini API");
      throw new Error("Empty response from Gemini API");
    }
    
    console.log("Response text length:", responseText.length);
    console.log("Response text preview:", responseText.substring(0, 200));
    
    // Extract JSON from response (in case there's any surrounding text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not extract JSON from response:", responseText.substring(0, 500));
      throw new Error(`Failed to extract JSON from Gemini response`);
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
    console.error("Error generating website with Gemini:", errorMsg);
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

    console.log("Calling Gemini API to explain code...");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    console.log("Gemini API response received for code explanation");
    
    const explanation = response.text;
    
    if (!explanation) {
      throw new Error("Empty response from Gemini API");
    }

    return explanation;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error explaining code with Gemini:", errorMsg);
    throw error;
  }
}
