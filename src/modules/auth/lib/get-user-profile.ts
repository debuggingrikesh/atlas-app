 

import { prisma } from '@/lib/db/prisma';
import type { UserProfile } from '@/modules/auth/types';
import type { BusinessWithMembership } from '@/modules/business/types';

type UserProfileWithBusinesses = UserProfile & {
  businesses: BusinessWithMembership[];
};

/**
 * Fetches a UserProfile by its ID, including all business memberships.
 * Returns null if the profile does not exist.
 */
export async function getUserProfile(
  userId: string
): Promise<UserProfileWithBusinesses | null> {
  const profile = await prisma.userProfile.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          business: true,
          rbacRole: { 
            select: { 
              name: true,
              permissions: { select: { permission: { select: { key: true } } } }
            } 
          },
        },
      },
    },
  });

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl,
    onboardingStep: profile.onboardingStep,
    onboardingCompletedAt: profile.onboardingCompletedAt,
    onboardingData: profile.onboardingData ? (profile.onboardingData as Record<string, unknown>) : null,
    isActive: profile.isActive,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    businesses: profile.memberships.map((m) => ({
      ...m.business,
      role: m.role,
      rbacRole: m.rbacRole,
    })),
  };
}
