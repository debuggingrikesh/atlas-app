export interface AIService {
  analyzeFeedback(text: string): Promise<unknown>;
}
