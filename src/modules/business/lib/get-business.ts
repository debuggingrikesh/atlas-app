/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from '@/lib/db/prisma';
import type { Business } from '@/modules/business/types';

/**
 * Fetches a single business by ID.
 * Always pass businessId from a trusted server source — never from unverified URL params alone.
 * Call requirePermission() before this function to verify access.
 */
export async function getBusiness(businessId: string): Promise<Business | null> {
  return prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
  });
}

/**
 * Fetches a single business by slug.
 * Used by the dashboard to resolve [businessSlug] route params.
 */
export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  return prisma.business.findFirst({
    where: { slug, deletedAt: null },
  });
}
