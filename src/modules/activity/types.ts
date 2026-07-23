 

import type { AuditEvent } from '@prisma/client';

export type ActivityItem = AuditEvent & {
  actor: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
};
