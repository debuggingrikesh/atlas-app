import { z } from 'zod';

export const createBusinessSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Business name must be at least 2 characters.' })
    .max(100, { message: 'Business name must be at most 100 characters.' })
    .trim(),
  industryTemplateId: z.string().min(1, { message: 'Please select an industry.' }),
  description: z.string().max(500).trim().optional(),
});

export const createBranchSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Branch name must be at least 2 characters.' })
    .max(100, { message: 'Branch name must be at most 100 characters.' })
    .trim(),
  address: z.string().max(255).trim().optional(),
});

export const completeOnboardingSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'Full name must be at least 2 characters.' })
    .max(100, { message: 'Full name must be at most 100 characters.' })
    .trim(),
  businessName: z
    .string()
    .min(2, { message: 'Business name must be at least 2 characters.' })
    .max(100, { message: 'Business name must be at most 100 characters.' })
    .trim(),
  industryTemplateId: z.string().min(1, { message: 'Please select an industry.' }),
  branchName: z
    .string()
    .min(2, { message: 'Branch name must be at least 2 characters.' })
    .max(100, { message: 'Branch name must be at most 100 characters.' })
    .trim(),
  branchAddress: z.string().max(255).trim().optional(),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
