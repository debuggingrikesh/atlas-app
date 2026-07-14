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
