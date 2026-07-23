 

import { AnalyzeFeedbackInput } from '../types/ai-types';

/**
 * Build a prompt for AI reputation analysis.
 * Returns structured JSON with sentiment, issue, emotion, action, and suggested response for ALL reviews.
 */
export const buildAnalysisPrompt = (input: AnalyzeFeedbackInput): string => {
  const isPositive = input.customerRating >= 4;

  let basePrompt = `You are an AI reputation analyst for a business.
Your task is to analyze a customer review and provide actionable intelligence.

BUSINESS CONTEXT:
Name: ${input.businessName}
Industry: ${input.industry}
${input.brandVoice ? `Brand Description: ${input.brandVoice}` : ''}

CUSTOMER REVIEW:
Rating: ${input.customerRating} out of 5 stars
${input.customerFeedback ? `Comment: "${input.customerFeedback}"` : 'Comment: None provided.'}

`;

  if (isPositive) {
    basePrompt += `
STRATEGY FOR POSITIVE REVIEWS:
- Thank the customer enthusiastically for their business and review.
- Reinforce the positive relationship.
- Keep the response warm and appreciative.
- Sentiment should be "Positive".
`;
  } else {
    basePrompt += `
STRATEGY FOR NEGATIVE REVIEWS:
- Acknowledge their concern.
- Apologize professionally for the experience (without admitting legal fault).
- Reassure them that you take feedback seriously and invite them to reach out to support.
- Sentiment should be "Negative" or "Very Negative".
`;
  }

  basePrompt += `
Respond with ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "sentiment": "Positive" | "Neutral" | "Negative" | "Very Negative",
  "mainIssue": "Brief description of the core complaint or praise",
  "customerEmotion": "e.g. Frustrated, Disappointed, Angry, Happy, Thrilled",
  "recommendedAction": "e.g. Contact customer personally, Offer resolution, Thank them",
  "suggestedResponse": "A professional, empathetic response draft (under 4 sentences, language: ${input.preferredLanguage}, tone: ${input.tone})",
  "confidenceScore": 0.95
}
${input.customInstructions ? `\nCustom Instructions: ${input.customInstructions}` : ''}
`;

  return basePrompt;
};
