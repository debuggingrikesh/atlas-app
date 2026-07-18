import { prisma } from '@/lib/db/prisma';
import { GeminiProvider } from '../providers/gemini-provider';
import { buildReputationPrompt, buildAnalysisPrompt } from '../prompts/reputation-prompts';
import { EntitlementService } from '@/modules/billing/services/entitlement-service';
import { UsageService } from '@/modules/reputation/services/usage-service';

export class AIService {
  static async getSettings(businessId: string) {
    return prisma.businessAISettings.findUnique({
      where: { businessId }
    });
  }

  static async updateSettings(businessId: string, data: { tone?: string; brandDescription?: string; preferredLanguage?: string; customInstructions?: string; autoGenerate?: boolean }) {
    return prisma.businessAISettings.upsert({
      where: { businessId },
      update: data,
      create: {
        businessId,
        ...data,
      }
    });
  }

  static async generateResponse(businessId: string, feedbackId: string) {
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
        const canAccess = await EntitlementService.canAccessFeature(businessId, 'AI_REPUTATION_RESPONSE');
        if (!canAccess) {
          throw new Error('AI generation is a paid feature. Please upgrade your subscription.');
        }

        const featureLimit = await EntitlementService.getFeatureLimit(businessId, 'AI_REPUTATION_RESPONSE');

        // 4. Check Usage Limit (atomically)
        const usageResult = await UsageService.checkAndIncrementUsage(
          businessId,
          'AI_REPUTATION_RESPONSE',
          featureLimit,
          tx
        );

        if (!usageResult.allowed) {
          throw new Error(usageResult.error || 'You have reached your AI generation limit.');
        }

        // 5. Generate response or analysis
        const isPositive = feedback.rating >= 4;
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

        const prompt = isPositive
          ? buildReputationPrompt(promptInput)
          : buildAnalysisPrompt(promptInput);

        const generatedText = await GeminiProvider.generateText(prompt);

        // 6. Store AIResponse
        const aiResponse = await tx.aIResponse.create({
          data: {
            businessId,
            feedbackId,
            generatedText,
            toneUsed: settings?.tone || 'Professional',
            status: 'DRAFT'
          }
        });

        return { response: aiResponse };
      });
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to generate response.', status: 400 };
    }
  }

  /**
   * Automatically generate an AI response or analysis for a given feedback item,
   * if the business has autoGenerate enabled and the feedback has a comment.
   * This is meant to be called asynchronously and not block the main request.
   */
  static async autoGenerateForFeedback(businessId: string, feedbackId: string) {
    try {
      const feedback = await prisma.customerFeedback.findUnique({
        where: { id: feedbackId },
      });

      if (!feedback || !feedback.comment || feedback.comment.trim() === '') {
        return; // Only generate for reviews with written feedback
      }

      const settings = await this.getSettings(businessId);
      if (settings && !settings.autoGenerate) {
        return; // Auto-generation disabled by business
      }

      // We still use the main generateResponse function to ensure we check entitlements
      // and update usage correctly.
      await this.generateResponse(businessId, feedbackId);
    } catch (err) {
      console.error('[AIService.autoGenerateForFeedback] failed:', err);
    }
  }
}
