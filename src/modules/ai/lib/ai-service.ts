/* eslint-disable @typescript-eslint/no-explicit-any */

export interface AIService {
  analyzeFeedback(text: string): Promise<any>;
}
