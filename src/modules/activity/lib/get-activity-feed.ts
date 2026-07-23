/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from '@/lib/db/prisma';
import type { ActivityItem } from '../types';

export async function getActivityFeed(
  businessId: string,
  options: { cursor?: string; limit: number }
): Promise<{ items: ActivityItem[]; nextCursor?: string }> {
  const { cursor, limit } = options;

  // 1. Fetch AuditEvent entries rigorously filtered by businessId
  const logs = await prisma.auditEvent.findMany({
    where: { businessId },
    take: limit + 1, // Fetch one extra to determine if there is a next page
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Skip the cursor itself
    }),
    orderBy: { occurredAt: 'desc' },
  });

  let nextCursor: string | undefined = undefined;
  if (logs.length > limit) {
    const nextItem = logs.pop(); // Remove the extra item
    nextCursor = nextItem?.id;
  }

  // 2. Extract actor IDs
  const actorIds = Array.from(new Set(logs.map((log) => log.actorUserId).filter(Boolean))) as string[];

  // 3. Fetch UserProfiles
  let userProfiles: Record<string, { id: string; email: string; fullName: string | null; avatarUrl: string | null }> = {};
  if (actorIds.length > 0) {
    const profiles = await prisma.userProfile.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, email: true, fullName: true, avatarUrl: true },
    });
    userProfiles = profiles.reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {} as typeof userProfiles);
  }

  // 4. Map to ActivityItem
  const items: ActivityItem[] = logs.map((log) => ({
    ...log,
    actor: log.actorUserId ? (userProfiles[log.actorUserId] ?? null) : null,
  }));

  return { items, nextCursor };
}
