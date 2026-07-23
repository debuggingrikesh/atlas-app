 

export type AITone = 'Professional' | 'Friendly' | 'Casual' | 'Luxury';

export interface AnalyzeFeedbackInput {
  businessName: string;
  industry: string;
  customerRating: number;
  customerFeedback?: string | null;
  brandVoice?: string | null;
  tone: string;
  preferredLanguage: string;
  customInstructions?: string | null;
}

export interface FeedbackAnalysisOutput {
  sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Very Negative';
  mainIssue: string;
  customerEmotion: string;
  recommendedAction: string;
  suggestedResponse: string;
  confidenceScore: number;
}
