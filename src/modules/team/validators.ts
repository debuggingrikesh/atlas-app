import { z } from 'zod';

export const updateMemberRoleSchema = z.object({
  roleId: z.string().min(1, { message: 'Role ID is required.' }),
  version: z.number().int().positive().optional(),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
