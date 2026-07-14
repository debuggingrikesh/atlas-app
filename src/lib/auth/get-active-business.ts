import { cookies } from 'next/headers';
import type { BusinessWithMembership } from '@/modules/business/types';

/**
 * Resolves the active business ID for server components by reading the
 * 'activeBusinessId' cookie and ensuring the user is actually a member of it.
 * Falls back to the first available business if the cookie is missing or invalid.
 */
export async function getActiveBusiness(
  businesses: BusinessWithMembership[]
): Promise<BusinessWithMembership | null> {
  if (!businesses || businesses.length === 0) return null;

  const cookieStore = await cookies();
  const activeId = cookieStore.get('activeBusinessId')?.value;

  if (activeId) {
    const matched = businesses.find((b) => b.id === activeId);
    if (matched) return matched;
  }

  // Fallback to the first business
  return businesses[0];
}
