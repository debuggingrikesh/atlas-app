/* eslint-disable @typescript-eslint/no-explicit-any */

import { z } from 'zod';

export const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address.'),
  roleId: z.string().min(1, 'Role ID is required.'),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const acceptInvitationSchema = z.object({
  // No payload needed, the token is in the URL and the user ID is in the session
});
