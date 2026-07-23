/* eslint-disable @typescript-eslint/no-explicit-any */

import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Role name must be at least 2 characters.' })
    .max(50, { message: 'Role name must be at most 50 characters.' })
    .trim(),
  permissionKeys: z
    .array(z.string().min(1))
    .optional()
    .default([]),
});

export const assignRoleSchema = z.object({
  memberId: z.string().min(1, { message: 'Member ID is required.' }),
  roleId: z.string().min(1, { message: 'Role ID is required.' }),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
