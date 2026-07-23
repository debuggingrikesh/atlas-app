 

import { prisma } from '@/lib/db/prisma';

/**
 * Converts a business name to a URL-safe slug.
 * Example: "VXL Education Nepal" → "vxl-education-nepal"
 */
function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric chars (except spaces and hyphens)
    .replace(/\s+/g, '-')          // replace spaces with hyphens
    .replace(/-+/g, '-')           // collapse consecutive hyphens
    .replace(/^-|-$/g, '');        // trim leading/trailing hyphens
}

/**
 * Generates a unique slug for a business name, retrying with a numeric
 * suffix if a collision is detected (up to 10 attempts).
 *
 * @throws Error if a unique slug cannot be generated within 10 attempts
 */
export async function generateUniqueSlug(name: string): Promise<string> {
  const base = nameToSlug(name);
  const MAX_ATTEMPTS = 10;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;

    const existing = await prisma.business.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) return candidate;
  }

  throw new Error(
    `Could not generate a unique slug for "${name}" after ${MAX_ATTEMPTS} attempts.`
  );
}
