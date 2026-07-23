 

import { prisma } from '@/lib/db/prisma';
import type { IndustryTemplate } from '@/modules/industry/types';

/**
 * Returns all active IndustryTemplate records.
 * This data is public — no auth required. Cache at the HTTP layer.
 */
export async function getActiveTemplates(): Promise<IndustryTemplate[]> {
  return prisma.industryTemplate.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
}
