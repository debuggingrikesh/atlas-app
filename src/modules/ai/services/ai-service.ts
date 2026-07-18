import { prisma } from '@/lib/db/prisma';
import { GeminiProvider } from '../providers/gemini-provider';
import { buildAnalysisPrompt } from '../prompts/reputation-prompts';
import { EntitlementService } from '@/modules/billing/services/entitlement-service';
import { UsageService } from '@/modules/reputation/services/usage-service';
import { z } from 'zod';

const FeedbackAnalysisSchema = z.object({
  sentiment: z.enum(['Positive', 'Neutral', 'Negative', 'Very Negative']),
  mainIssue: z.string().default(''),
  customerEmotion: z.string().default(''),
  recommendedAction: z.string().default(''),
  suggestedResponse: z.string().default(''),
  confidenceScore: z.number().min(0).max(1).default(0.95),
});

export class AIService {
  static async getSettings(businessId: string) {
    return prisma.businessAISettings.findUnique({
      where: { businessId }
    });
  }

  static async updateSettings(businessId: string, data: { tone?: string; brandDescription?: string; preferredLanguage?: string; customInstructions?: string }) {
    return prisma.businessAISettings.upsert({
      where: { businessId },
      update: data,
      create: {
        businessId,
        ...data,
      }
    });
  }

  static async analyzeFeedback(businessId: string, feedbackId: string) {
    // 1. Fetch Feedback
    const feedback = await prisma.customerFeedback.findUnique({
      where: { id: feedbackId },
      include: { business: true }
    });

    if (!feedback) {
      return { error: 'Feedback not found', status: 404 };
    }

    if (feedback.businessId !== businessId) {
      return { error: 'Unauthorized', status: 403 };
    }

    // 2. Fetch AI Settings
    const settings = await AIService.getSettings(businessId);

    try {
      return await prisma.$transaction(async (tx) => {
        // 3. Check Entitlement
        const canAccess = await EntitlementService.canAccessFeature(businessId, 'AI_REPUTATION_ANALYSIS');
        if (!canAccess) {
          throw new Error('AI generation is a paid feature. Please upgrade your subscription.');
        }

        const featureLimit = await EntitlementService.getFeatureLimit(businessId, 'AI_REPUTATION_ANALYSIS');

        // 4. Check Usage Limit (atomically)
        const usageResult = await UsageService.checkAndIncrementUsage(
          businessId,
          'AI_REPUTATION_ANALYSIS',
          featureLimit,
          tx
        );

        if (!usageResult.allowed) {
          throw new Error(usageResult.error || 'You have reached your AI generation limit.');
        }

        // 5. Generate structured analysis
        const promptInput = {
          businessName: feedback.business.name,
          industry: 'Business', // Defaulting, in a real system we might join IndustryTemplate
          customerRating: feedback.rating,
          customerFeedback: feedback.comment,
          brandVoice: settings?.brandDescription,
          tone: settings?.tone || 'Professional',
          preferredLanguage: settings?.preferredLanguage || 'English',
          customInstructions: settings?.customInstructions
        };

        const prompt = buildAnalysisPrompt(promptInput);
        // 5. Generate AI analysis
        const { data: rawJson, usageMetadata } = await GeminiProvider.generateJSON(prompt);

        // 6. Validate with Zod
        const parsedData = FeedbackAnalysisSchema.parse(rawJson);

        // 7. Store FeedbackAnalysis
        const analysisResult = await tx.feedbackAnalysis.create({
          data: {
            businessId,
            feedbackId,
            analysisData: parsedData,
            status: 'DRAFT'
          }
        });

        // 8. Track AI Usage Foundation
        await tx.aIUsageLog.create({
          data: {
            businessId,
            model: 'gemini-2.5-flash',
            inputTokens: usageMetadata?.promptTokenCount ?? null,
            outputTokens: usageMetadata?.candidatesTokenCount ?? null,
          }
        });

        return { response: analysisResult };
      });
    } catch (err: unknown) {
      console.error('[AIService.analyzeFeedback] failed:', err);
      return { error: err instanceof Error ? err.message : 'Failed to analyze feedback.', status: 400 };
    }
  }

}
