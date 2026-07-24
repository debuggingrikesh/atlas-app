import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
 

import type { AuditActionType, AuditResourceTypeType } from '@atlas/core';
import { AuditService } from '@/lib/audit/audit-service';
import { requireAuth } from '@/lib/auth/require-auth';
import { completeOnboardingSchema } from '@/lib/validators/business';
import { successResponse, errorResponse } from '@/lib/api/response';
import { generateUniqueSlug } from '@/modules/business/lib/generate-slug';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

import { SYSTEM_ROLE_PERMISSIONS } from '@/modules/reputation/permissions';

/**
 * POST /api/onboarding/complete
 *
 * The critical onboarding endpoint. Creates ALL application records in a single
 * Prisma transaction. If any step fails, the entire transaction rolls back —
 * no partial data is left in the database.
 *
 * Transaction order:
 *   1.  UserProfile (upsert)
 *   2.  Business
 *   3.  System Roles (OWNER, ADMIN, MEMBER) for the business
 *   4.  RolePermission entries for each system role
 *   5.  BusinessMember (OWNER) — dual-write: role enum + roleId
 *   6.  Branch
 *   7.  AuditLog entries
 *   8.  Mark onboardingCompletedAt on UserProfile
 */
async function POST_handler(request: Request) {
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

    // Verify the industryTemplate exists and is active before starting the transaction
    const template = await prisma.industryTemplate.findUnique({
      where: { id: industryTemplateId },
      select: { isActive: true },
    });

    if (!template || !template.isActive) {
      return errorResponse('VALIDATION_ERROR', 'Invalid or inactive industry template.', 400);
    }

    // Check if this user already has a UserProfile (idempotency guard)
    const existingProfile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      select: {
        onboardingCompletedAt: true,
        memberships: { select: { business: { select: { slug: true } } } },
      },
    });

    if (existingProfile?.onboardingCompletedAt) {
      // Onboarding already completed — return the business slug for redirect
      const slug = existingProfile.memberships[0]?.business?.slug;
      return successResponse({ businessSlug: slug, alreadyCompleted: true });
    }

    const slug = await generateUniqueSlug(businessName);
    const now = new Date();

    const txResult = await prisma.$transaction(async (tx) => {
      // 1. Upsert UserProfile
      const profile = await tx.userProfile.upsert({
        where: { id: user.id },
        update: { fullName, onboardingStep: 4, onboardingData: Prisma.DbNull },
        create: { id: user.id, email: user.email, fullName, onboardingStep: 4, onboardingData: Prisma.DbNull },
      });

      // 2. Create Business
      const business = await tx.business.create({
        data: { name: businessName, slug, industryTemplateId },
      });

      // 3. Create the three system roles
      const roleNames = ['OWNER', 'ADMIN', 'MEMBER'] as const;
      const createdRoles: Record<string, string> = {};

      for (const roleName of roleNames) {
        const role = await tx.role.create({
          data: { name: roleName, businessId: business.id, isSystem: true },
        });
        createdRoles[roleName] = role.id;
      }

      // 4. Assign permissions to each system role
      for (const roleName of roleNames) {
        const permKeys = SYSTEM_ROLE_PERMISSIONS[roleName];
        const permissions = await tx.permission.findMany({
          where: { key: { in: permKeys } },
          select: { id: true },
        });

        if (permissions.length > 0) {
          await tx.rolePermission.createMany({
            data: permissions.map((p) => ({
              roleId: createdRoles[roleName],
              permissionId: p.id,
            })),
            skipDuplicates: true,
          });
        }
      }

      // 5. Create OWNER BusinessMember — dual-write
      const member = await tx.businessMember.create({
        data: {
          userId: user.id,
          businessId: business.id,
          role: 'OWNER',                 // legacy enum — preserved
          roleId: createdRoles['OWNER'],   // RBAC FK — new
        },
      });

      // 6. Create first Branch
      const branch = await tx.branch.create({
        data: {
          name: branchName,
          businessId: business.id,
          address: branchAddress ?? null,
        },
      });

      // 7. AuditLog: role.created (for each system role)
      for (const roleName of roleNames) {
        await AuditService.record({
        action: 'role.created' as AuditActionType,
        resourceType: 'Role' as AuditResourceTypeType,
        resourceId: createdRoles[roleName],
        actorType: 'USER',
        actorUserId: user.id,
        businessId: business.id,
        severity: 'INFO',
        summary: `System event ${'role.created'}`,
        metadata: {
              roleName,
              isSystem: true,
              permissions: SYSTEM_ROLE_PERMISSIONS[roleName],
            },
          
      }, tx)
      }

      // 8. AuditLog: UserProfile created
      await AuditService.record({
        action: 'user_profile.created' as AuditActionType,
        resourceType: 'UserProfile' as AuditResourceTypeType,
        resourceId: profile.id,
        actorType: 'USER',
        actorUserId: user.id,
        businessId: business.id,
        severity: 'INFO',
        summary: `System event ${'user_profile.created'}`,
        metadata: { email: user.email, fullName },
        
      }, tx)

      // 9. AuditLog: Business created
      await AuditService.record({
        action: 'business.created' as AuditActionType,
        resourceType: 'Business' as AuditResourceTypeType,
        resourceId: business.id,
        actorType: 'USER',
        actorUserId: user.id,
        businessId: business.id,
        severity: 'INFO',
        summary: `System event ${'business.created'}`,
        metadata: { name: business.name, slug: business.slug },
        
      }, tx)

      // 10. AuditLog: BusinessMember created
      await AuditService.record({
        action: 'business_member.created' as AuditActionType,
        resourceType: 'BusinessMember' as AuditResourceTypeType,
        resourceId: member.id,
        actorType: 'USER',
        actorUserId: user.id,
        businessId: business.id,
        severity: 'INFO',
        summary: `System event ${'business_member.created'}`,
        metadata: { role: 'OWNER', roleId: createdRoles['OWNER'] },
        
      }, tx)

      // 11. AuditLog: Branch created
      await AuditService.record({
        action: 'branch.created' as AuditActionType,
        resourceType: 'Branch' as AuditResourceTypeType,
        resourceId: branch.id,
        actorType: 'USER',
        actorUserId: user.id,
        businessId: business.id,
        severity: 'INFO',
        summary: `System event ${'branch.created'}`,
        metadata: { name: branch.name, address: branch.address },
        
      }, tx)

      // 12. Mark onboarding complete
      await tx.userProfile.update({
        where: { id: user.id },
        data: { onboardingCompletedAt: now },
      });

      return { business, branch };
    });

    return successResponse(
      {
        businessSlug: txResult.business.slug,
        businessId: txResult.business.id,
        branchId: txResult.branch.id,
      },
      201
    );
  } catch (err) {
    logger.error({ message: 'API Error', context: '[onboarding/complete] Unexpected error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'Failed to complete onboarding. Please try again.', 500);
  }
}

export const POST = withErrorHandling(POST_handler, 'POST /api/onboarding/complete');
