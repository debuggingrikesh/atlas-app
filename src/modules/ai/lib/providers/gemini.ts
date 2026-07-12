import { AIService } from '../ai-service';

export class GeminiProvider implements AIService {
  async analyzeFeedback(): Promise<unknown> {
    throw new Error('Not implemented');
  }
}
