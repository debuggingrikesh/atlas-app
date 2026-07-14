export type AITone = 'Professional' | 'Friendly' | 'Casual' | 'Luxury';

export interface GenerateResponseInput {
  businessName: string;
  industry: string;
  customerRating: number;
  customerFeedback?: string | null;
  brandVoice?: string | null;
  tone: string;
  preferredLanguage: string;
  customInstructions?: string | null;
}

export interface GenerateResponseOutput {
  generatedText: string;
}
