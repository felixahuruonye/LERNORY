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
  const systemPrompt = `You are an expert web designer and developer. Generate a complete, functional website based on the user's request.

You MUST respond with ONLY a JSON object (no markdown, no code fences, just pure JSON) in this exact format:
{
  "title": "Website Title",
  "html": "<complete HTML code>",
  "css": "<complete CSS code>",
  "js": "<complete JavaScript code>"
}

Requirements:
- HTML: Complete, valid HTML5 with proper structure, responsive design
- CSS: Modern, clean styling with animations where appropriate
- JS: Functional JavaScript (can be empty if not needed)
- Make it visually appealing and professional
- Use modern design patterns
- Include hover effects and transitions
- Ensure it's mobile responsive with media queries
- Use a modern color scheme
- Typography should be clean and readable

DO NOT include any markdown, code fences, or explanations. ONLY return valid JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
      contents: prompt,
    });

    const responseText = response.text || "";
    
    // Extract JSON from response (in case there's any surrounding text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from Gemini response");
    }

    const generatedData = JSON.parse(jsonMatch[0]);

    return {
      title: generatedData.title || "Generated Website",
      html: generatedData.html || "<h1>Error generating HTML</h1>",
      css: generatedData.css || "",
      js: generatedData.js || "",
    };
  } catch (error) {
    console.error("Error generating website with Gemini:", error);
    throw new Error(`Failed to generate website: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
