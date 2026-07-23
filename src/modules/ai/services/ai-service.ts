/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from '@/lib/db/prisma';
import { GeminiProvider } from '../providers/gemini-provider';
import { buildAnalysisPrompt } from '../prompts/reputation-prompts';
import { EntitlementService } from '@/modules/billing/services/entitlement-service';
import { UsageService } from '@/modules/reputation/services/usage-service';
import { AuditService } from '@/lib/audit/audit-service';
import { logger } from '@/lib/logger';
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

  static async analyzeFeedback(businessId: string, feedbackId: string, userId?: string, requestId?: string) {
    // 1. Fetch Feedback (Scoped to Business)
    const feedback = await prisma.customerFeedback.findFirst({
      where: { id: feedbackId, businessId },
      include: { business: true }
    });

    if (!feedback) {
      return { error: 'Feedback not found', status: 404 };
    }

    // 2. Fetch AI Settings
    const settings = await AIService.getSettings(businessId);

    try {
        // 3. Check Entitlement
        const canAccess = await EntitlementService.canAccessFeature(businessId, 'AI_REPUTATION_ANALYSIS');
        if (!canAccess) {
          throw new Error('AI generation is a paid feature. Please upgrade your subscription.');
        }

        const featureLimit = await EntitlementService.getFeatureLimit(businessId, 'AI_REPUTATION_ANALYSIS');

        // 4. Check Usage Limit (atomically) in a short-lived transaction
        const usageResult = await prisma.$transaction(async (tx) => {
          return UsageService.checkAndIncrementUsage(
            businessId,
            'AI_REPUTATION_ANALYSIS',
            featureLimit,
            tx
          );
        });

        if (!usageResult.allowed) {
          throw new Error(usageResult.error || 'You have reached your AI generation limit.');
        }

        let rawJson: any;
        let usageMetadata: any;
        let parsedData: any;

        try {
          // 5. Generate structured analysis OUTSIDE the transaction
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
          const result = await GeminiProvider.generateJSON(prompt);
          rawJson = result.data;
          usageMetadata = result.usageMetadata;

          // 6. Validate with Zod
          parsedData = FeedbackAnalysisSchema.parse(rawJson);
        } catch (err: any) {
          // Compensate usage on network or parsing failure
          await prisma.businessFeatureUsage.updateMany({
            where: {
              businessId,
              feature: 'AI_REPUTATION_ANALYSIS',
              count: { gt: 0 }
            },
            data: {
              count: { decrement: 1 }
            }
          });
          throw err;
        }

        // 7. Store FeedbackAnalysis, Usage log, and AuditLog in a final short transaction
        return await prisma.$transaction(async (tx) => {
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

        // 9. Create Audit Log
        await AuditService.record({
          action: 'reputation.feedback.analyzed',
          resourceType: 'FEEDBACK_ANALYSIS',
          resourceId: analysisResult.id,
          actorType: userId ? 'USER' : 'SYSTEM',
          actorUserId: userId,
          businessId: businessId,
          tenantId: businessId,
          requestId,
          severity: 'INFO',
          summary: userId ? 'User analyzed feedback using AI' : 'System analyzed feedback using AI',
          metadata: { feedbackId },
        }, tx);

          return { response: analysisResult };
        });
    } catch (err: any) {
      logger.error({
        message: 'Feedback analysis failed',
        businessId,
        feedbackId,
        feature: 'ai'
      }, err instanceof Error ? err.message : String(err));
      return { error: err instanceof Error ? err.message : 'Failed to analyze feedback.', status: 400 };
    }
  }

}
