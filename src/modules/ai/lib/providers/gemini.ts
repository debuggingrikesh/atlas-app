/* eslint-disable @typescript-eslint/no-explicit-any */

import { AIService } from '../ai-service';

export class GeminiProvider implements AIService {
  async analyzeFeedback(): Promise<any> {
    throw new Error('Not implemented');
  }
}
