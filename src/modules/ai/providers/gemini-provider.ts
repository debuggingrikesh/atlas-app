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
    let ai;
    try {
      ai = getGenAI();
    } catch (err: unknown) {
      console.error('[GeminiProvider] Missing API key or initialization error:', err);
      throw new Error('AI configuration error. Missing API key.');
    }

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
        
        // Categorize errors for structured logging
        let errorCategory = 'UNKNOWN_ERROR';
        if (isAbort) errorCategory = 'NETWORK_TIMEOUT';
        else if (status === 429) errorCategory = 'QUOTA_EXCEEDED';
        else if (status === 400) errorCategory = 'INVALID_REQUEST';
        else if (status === 403) errorCategory = 'PERMISSION_DENIED';
        else if (status !== undefined && status >= 500 && status < 600) errorCategory = 'SERVER_ERROR';

        console.error(`[GeminiProvider] ${errorCategory} (Attempt ${attempt}):`, err);

        const isRateLimit = status === 429;
        const isServerError = status !== undefined && status >= 500 && status < 600;
        
        if (attempt >= maxRetries || (!isAbort && !isRateLimit && !isServerError)) {
          // If it's a non-retryable error (e.g., INVALID_REQUEST or PERMISSION_DENIED) or we've exhausted retries, throw.
          throw new Error(`Failed to generate AI response: ${errorCategory}`);
        }
        
        // Exponential backoff for retryable errors
        const backoffMs = Math.pow(2, attempt) * 500;
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
    throw new Error('Failed to generate AI response after retries.');
  }
}
