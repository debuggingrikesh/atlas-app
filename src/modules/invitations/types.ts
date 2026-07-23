/* eslint-disable @typescript-eslint/no-explicit-any */

import { z } from 'zod';
import { createInvitationSchema } from './validators';
import type { Invitation as PrismaInvitation } from '@prisma/client';
import type { Role } from '@prisma/client';

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;

export type Invitation = PrismaInvitation & {
  role: Role;
};
