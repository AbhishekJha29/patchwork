import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is not set.");
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function generateText(prompt: string, maxRetries = 1): Promise<string> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const model = ai.getGenerativeModel({ model: modelName });

  let attempts = 0;
  let lastError: any = null;

  while (attempts <= maxRetries) {
    try {
      attempts++;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text) {
        return text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini API call failed (attempt ${attempts}/${maxRetries + 1}):`, err?.message || err);
      if (attempts <= maxRetries) {
        // Wait 500ms before retrying
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  throw lastError || new Error("Failed to generate content from Gemini API.");
}
