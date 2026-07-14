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
    .regex(/[a-zA-Z0-9]/, { message: 'Must contain at least one alphanumeric character.' })
    .trim(),
  businessName: z
    .string()
    .min(2, { message: 'Business name must be at least 2 characters.' })
    .max(100, { message: 'Business name must be at most 100 characters.' })
    .regex(/[a-zA-Z0-9]/, { message: 'Must contain at least one alphanumeric character.' })
    .trim(),
  industryTemplateId: z.string().min(1, { message: 'Please select an industry.' }),
  branchName: z
    .string()
    .min(2, { message: 'Branch name must be at least 2 characters.' })
    .max(100, { message: 'Branch name must be at most 100 characters.' })
    .regex(/[a-zA-Z0-9]/, { message: 'Must contain at least one alphanumeric character.' })
    .trim(),
  branchAddress: z.string().max(255).trim().optional(),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;

// ── Update Business ──────────────────────────────────────────────────────────

export const updateBusinessSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: 'Business name must be at least 2 characters.' })
      .max(100, { message: 'Business name must be at most 100 characters.' })
      .trim()
      .optional(),
    description: z.string().max(500).trim().optional(),
    logoUrl: z.string().url({ message: 'Must be a valid URL.' }).max(500).optional(),
    version: z.number().int().positive().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update.',
  });

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
