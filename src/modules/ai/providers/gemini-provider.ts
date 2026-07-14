import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

const getGenAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export class GeminiProvider {
  static async generateText(prompt: string, maxRetries = 3): Promise<string> {
    const ai = getGenAI();
    let attempt = 0;
    
    while (attempt < maxRetries) {
      attempt++;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            temperature: 0.7,
            maxOutputTokens: 250,
          },
        });
        
        clearTimeout(timeout);

        if (!response.text) {
          throw new Error('No text generated from Gemini');
        }

        return response.text.trim();
      } catch (err: unknown) {
        clearTimeout(timeout);
        
        const isAbort = err instanceof Error && err.name === 'AbortError';
        const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : undefined;
        const isRateLimit = status === 429;
        const isServerError = status !== undefined && status >= 500 && status < 600;
        
        if (attempt >= maxRetries || (!isAbort && !isRateLimit && !isServerError)) {
          console.error(`[GeminiProvider] Error generating content (Attempt ${attempt}):`, err);
          throw new Error('Failed to generate AI response.');
        }
        
        // Exponential backoff
        const backoffMs = Math.pow(2, attempt) * 500;
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
    throw new Error('Failed to generate AI response after retries.');
  }
}
