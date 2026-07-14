import type { AuditLog } from '@prisma/client';

export type ActivityItem = AuditLog & {
  actor: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
};
