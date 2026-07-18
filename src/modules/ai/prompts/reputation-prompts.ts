import { GenerateResponseInput } from '../types/ai-types';

export const buildReputationPrompt = (input: GenerateResponseInput): string => {
  const isPositive = input.customerRating >= 4;

  let basePrompt = `You are a professional customer service representative for a business.
Your task is to write a reply to a customer's review.

BUSINESS CONTEXT:
Name: ${input.businessName}
Industry: ${input.industry}
${input.brandVoice ? `Brand Description: ${input.brandVoice}` : ''}

CUSTOMER REVIEW:
Rating: ${input.customerRating} out of 5 stars
${input.customerFeedback ? `Comment: "${input.customerFeedback}"` : 'Comment: None provided.'}

RESPONSE GUIDELINES:
- Language: ${input.preferredLanguage}
- Tone: ${input.tone}
- Do NOT use placeholder text like [Name] or [Phone Number]. Keep it general if specific info is missing.
- Keep the response concise, under 4 sentences.
- Avoid arguing, blaming the customer, making false promises, or mentioning internal systems.
${input.customInstructions ? `- Custom Instructions: ${input.customInstructions}` : ''}

`;

  if (isPositive) {
    basePrompt += `
STRATEGY FOR POSITIVE REVIEWS:
- Thank the customer enthusiastically for their business and review.
- Reinforce the positive relationship.
- Keep it warm and appreciative.
`;
  } else {
    basePrompt += `
STRATEGY FOR NEGATIVE REVIEWS:
- Acknowledge their concern.
- Apologize professionally for the experience (without admitting legal fault).
- Reassure them that you take feedback seriously and invite them to reach out to support.
`;
  }

  basePrompt += `\nWrite the response draft now:\n`;
  return basePrompt;
};

/**
 * Build a prompt for AI reputation analysis of negative reviews.
 * Returns structured JSON with sentiment, issue, emotion, action, and suggested response.
 */
export const buildAnalysisPrompt = (input: GenerateResponseInput): string => {
  return `You are an AI reputation analyst for a business.
Your task is to analyze a negative customer review and provide actionable intelligence.

BUSINESS CONTEXT:
Name: ${input.businessName}
Industry: ${input.industry}
${input.brandVoice ? `Brand Description: ${input.brandVoice}` : ''}

CUSTOMER REVIEW:
Rating: ${input.customerRating} out of 5 stars
${input.customerFeedback ? `Comment: "${input.customerFeedback}"` : 'Comment: None provided.'}

Respond with ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "sentiment": "Negative" or "Very Negative",
  "mainIssue": "Brief description of the core complaint",
  "customerEmotion": "e.g. Frustrated, Disappointed, Angry",
  "recommendedAction": "e.g. Contact customer personally, Offer resolution",
  "suggestedResponse": "A professional, empathetic response draft (under 4 sentences, language: ${input.preferredLanguage}, tone: ${input.tone})"
}
${input.customInstructions ? `\nCustom Instructions: ${input.customInstructions}` : ''}
`;
};
