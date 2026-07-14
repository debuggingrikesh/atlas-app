import { z } from 'zod';

export const updateReputationSettingsSchema = z.object({
  googleRedirectRating: z.number().int().min(1).max(5).optional(),
});

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  branchId: z.string().optional(),
  googleReviewUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED']).optional(),
  googleReviewUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export const createReviewRequestSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
  customerName: z.string().max(100).optional(),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  customerPhone: z.string().max(20).optional(),
  source: z.enum(['MANUAL', 'WHATSAPP', 'QR', 'EMAIL']).optional().default('MANUAL'),
});

export const publicReviewSubmissionSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5),
  comment: z.string().max(1000).optional(),
  customerName: z.string().max(100).optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().max(20).optional(),
});
