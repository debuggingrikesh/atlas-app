import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GeminiProvider } from '../providers/gemini-provider';

const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent
      };
    }
  };
});
vi.mock('@/lib/env.server', () => ({
  getAiEnv: vi.fn().mockReturnValue({ GEMINI_API_KEY: 'test-key' })
}));

describe('GeminiProvider Reliability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retries on transient rate limit (429) errors', async () => {
    mockGenerateContent
      .mockRejectedValueOnce({ status: 429, message: 'Rate Limit' })
      .mockResolvedValueOnce({ text: '{"sentiment": "Positive"}', usageMetadata: {} });

    const result = await GeminiProvider.generateJSON('test prompt', 2);
    expect(result.data).toEqual({ sentiment: 'Positive' });
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('does not retry on permanent (400) errors', async () => {
    mockGenerateContent.mockRejectedValueOnce({ status: 400, message: 'Invalid Request' });

    await expect(GeminiProvider.generateJSON('test prompt', 3)).rejects.toThrow('INVALID_REQUEST');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});
