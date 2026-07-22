import { AuditService } from '@/lib/audit/audit-service';
import { prisma } from '@/lib/db/prisma';
import type { UpdateProfileInput } from '@/lib/validators/auth';
import type { UserProfile } from '@/modules/auth/types';

/**
 * Updates a UserProfile record and emits an AuditLog entry,
 * both inside a single Prisma transaction.
 *
 * Only call this from server-side code after requireAuth() has confirmed
 * a valid session. The userId must come from the verified session — never
 * from an unvalidated client payload.
 */
export async function updateProfile(
  userId: string,
  userEmail: string,
  input: UpdateProfileInput
): Promise<UserProfile> {
  return prisma.$transaction(async (tx) => {
    // 1. Apply partial update or create if it doesn't exist
    const profile = await tx.userProfile.upsert({
      where: { id: userId },
      update: {
        ...(input.fullName !== undefined && { fullName: input.fullName }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
      },
      create: {
        id: userId,
        email: userEmail.toLowerCase().trim(),
        fullName: input.fullName ?? '',
        avatarUrl: input.avatarUrl ?? null,
        onboardingStep: 4, // Skip owner onboarding
        isActive: true,
      }
    });

    // 2. Audit log
    await AuditService.record({
        action: 'user.profile.updated' as any,
        resourceType: 'UserProfile' as any,
        resourceId: userId,
        actorType: 'USER',
        actorUserId: userId,
        businessId: undefined,
        severity: 'INFO',
        summary: `System event ${'user.profile.updated'}`,
        metadata: { changes: input },
      
      }, tx)

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
    };
  });
}
