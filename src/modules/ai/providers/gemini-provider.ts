/* eslint-disable @typescript-eslint/no-explicit-any */

import { GoogleGenAI } from '@google/genai';
import { AIModelSchema } from '@atlas/core';

let aiInstance: GoogleGenAI | null = null;

import { getAiEnv } from '@/lib/env.server';
import { logger } from '@/lib/logger';
import { AIConfigurationError } from '@/lib/errors';

const getGenAI = () => {
  if (!aiInstance) {
    const { GEMINI_API_KEY } = getAiEnv();
    if (!GEMINI_API_KEY) {
       throw new AIConfigurationError('Missing GEMINI_API_KEY');
    }
    aiInstance = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return aiInstance;
};

export interface UsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

export class GeminiProvider {
  static async generateJSON(prompt: string, maxRetries = 3): Promise<{ data: any, usageMetadata?: UsageMetadata }> {
    const { text: rawText, usageMetadata } = await this.generateText(prompt, maxRetries, 'application/json');
    try {
      // Clean up markdown block if Gemini accidentally wraps it
      let cleaned = rawText.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '');
      if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '');
      if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, '');
      return { data: JSON.parse(cleaned.trim()), usageMetadata };
    } catch (err: unknown) {
      logger.error({ message: 'Failed to parse JSON response from AI', error: err instanceof Error ? err.message : String(err), feature: 'ai' });
      throw new Error('AI returned invalid JSON data.');
    }
  }

  static async generateText(prompt: string, maxRetries = 3, mimeType?: string): Promise<{ text: string, usageMetadata?: UsageMetadata }> {
    let ai;
    try {
      ai = getGenAI();
    } catch (err: any) {
      logger.error({ message: 'AI configuration error', error: err.message, feature: 'ai' });
      throw new AIConfigurationError('AI configuration error. Missing API key.');
    }

    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await ai.models.generateContent({
          model: AIModelSchema.enum['gemini-2.5-flash'],
          contents: prompt,
          config: {
            temperature: 0.7,
            maxOutputTokens: 500,
            ...(mimeType ? { responseMimeType: mimeType } : {})
          },
        });

        clearTimeout(timeout);

        if (!response.text) {
          throw new Error('No text generated from Gemini');
        }

        return {
          text: response.text.trim(),
          usageMetadata: response.usageMetadata as UsageMetadata | undefined
        };
      } catch (err: any) {
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

        logger.error({
          message: 'AI Provider error',
          errorCategory,
          attempt,
          status,
          provider: 'gemini',
          model: AIModelSchema.enum['gemini-2.5-flash'],
          feature: 'ai'
        }, err instanceof Error ? err.message : String(err));

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
