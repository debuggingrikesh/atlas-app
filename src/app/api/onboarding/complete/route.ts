import { requireAuth } from '@/lib/auth/require-auth';
import { completeOnboardingSchema } from '@/lib/validators/business';
import { successResponse, errorResponse } from '@/lib/api/response';
import { generateUniqueSlug } from '@/modules/business/lib/generate-slug';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/onboarding/complete
 *
 * The critical onboarding endpoint. Creates ALL application records in a single
 * Prisma transaction. If any step fails, the entire transaction rolls back —
 * no partial data is left in the database.
 *
 * Transaction order:
 *   1. UserProfile
 *   2. Business
 *   3. BusinessMember (OWNER)
 *   4. Branch
 *   5. AuditLog entries (UserProfile, Business, BusinessMember, Branch)
 *   6. Mark onboardingCompletedAt on UserProfile
 */
export async function POST(request: Request) {
  const { user, errorRes } = await requireAuth();
  if (errorRes) return errorRes;

  // MVP: Bypass email verification check

  try {
    const body = await request.json();
    const result = completeOnboardingSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        result.error.issues[0]?.message ?? 'Invalid input.',
        400
      );
    }

    const { fullName, businessName, industryTemplateId, branchName, branchAddress } = result.data;

    // Verify the industryTemplate exists before starting the transaction
    const template = await prisma.industryTemplate.findUnique({
      where: { id: industryTemplateId },
      select: { id: true },
    });

    if (!template) {
      return errorResponse('NOT_FOUND', 'Selected industry template does not exist.', 404);
    }

    // Check if this user already has a UserProfile (idempotency guard)
    const existingProfile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      select: { onboardingCompletedAt: true, memberships: { select: { business: { select: { slug: true } } } } },
    });

    if (existingProfile?.onboardingCompletedAt) {
      // Onboarding already completed — return the business slug for redirect
      const slug = existingProfile.memberships[0]?.business?.slug;
      return successResponse({ businessSlug: slug, alreadyCompleted: true });
    }

    const slug = await generateUniqueSlug(businessName);
    const now = new Date();

    const result2 = await prisma.$transaction(async (tx) => {
      // 1. Upsert UserProfile (create if first time, update if resuming)
      const profile = await tx.userProfile.upsert({
        where: { id: user.id },
        update: {
          fullName,
          onboardingStep: 4,
        },
        create: {
          id: user.id,
          email: user.email,
          fullName,
          onboardingStep: 4,
        },
      });

      // 2. Create Business
      const business = await tx.business.create({
        data: {
          name: businessName,
          slug,
          industryTemplateId,
        },
      });

      // 3. Create OWNER BusinessMember
      const member = await tx.businessMember.create({
        data: {
          userId: user.id,
          businessId: business.id,
          role: 'OWNER',
        },
      });

      // 4. Create first Branch
      const branch = await tx.branch.create({
        data: {
          name: branchName,
          businessId: business.id,
          address: branchAddress ?? null,
        },
      });

      // 5. AuditLog: UserProfile created
      await tx.auditLog.create({
        data: {
          action: 'user_profile.created',
          entityType: 'UserProfile',
          entityId: profile.id,
          actorId: user.id,
          businessId: business.id,
          metadata: { email: user.email, fullName },
        },
      });

      // 6. AuditLog: Business created
      await tx.auditLog.create({
        data: {
          action: 'business.created',
          entityType: 'Business',
          entityId: business.id,
          actorId: user.id,
          businessId: business.id,
          metadata: { name: business.name, slug: business.slug },
        },
      });

      // 7. AuditLog: BusinessMember created
      await tx.auditLog.create({
        data: {
          action: 'business_member.created',
          entityType: 'BusinessMember',
          entityId: member.id,
          actorId: user.id,
          businessId: business.id,
          metadata: { role: 'OWNER' },
        },
      });

      // 8. AuditLog: Branch created
      await tx.auditLog.create({
        data: {
          action: 'branch.created',
          entityType: 'Branch',
          entityId: branch.id,
          actorId: user.id,
          businessId: business.id,
          metadata: { name: branch.name, address: branch.address },
        },
      });

      // 9. Mark onboarding complete
      await tx.userProfile.update({
        where: { id: user.id },
        data: { onboardingCompletedAt: now },
      });

      return { business, branch };
    });

    return successResponse(
      {
        businessSlug: result2.business.slug,
        businessId: result2.business.id,
        branchId: result2.branch.id,
      },
      201
    );
  } catch (err) {
    console.error('[onboarding/complete] Unexpected error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to complete onboarding. Please try again.', 500);
  }
}
