import { prisma } from '@/lib/db/prisma';
import type { BusinessWithMembership } from '@/modules/business/types';

/**
 * Returns all businesses that the given user is a member of.
 * Scoped entirely to the userId — no cross-tenant data leakage possible.
 */
export async function getUserBusinesses(
  userId: string
): Promise<BusinessWithMembership[]> {
  const memberships = await prisma.businessMember.findMany({
    where: { 
      userId,
      business: { deletedAt: null }
    },
    include: { 
      business: true,
      rbacRole: {
        select: {
          name: true,
          permissions: {
            select: { permission: { select: { key: true } } }
          }
        }
      }
    },
    orderBy: { createdAt: 'asc' },
  });

  return memberships.map((m) => ({
    ...m.business,
    role: m.role,
    rbacRole: m.rbacRole,
  }));
}
