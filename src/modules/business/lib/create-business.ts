/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AuditActionType, AuditResourceTypeType } from '@atlas/core/audit';
import { AuditService } from '@/lib/audit/audit-service';
import { prisma } from '@/lib/db/prisma';
import { generateUniqueSlug } from './generate-slug';
import type { CreateBusinessInput, Business } from '@/modules/business/types';

import { SYSTEM_ROLE_PERMISSIONS } from '@atlas/core/auth';

type CreateBusinessResult = Business & {
  memberId: string;
};

/**
 * Creates a Business, three system Roles (OWNER/ADMIN/MEMBER), their
 * RolePermission entries, and the OWNER BusinessMember record in a single
 * Prisma transaction.
 *
 * Dual-write strategy (transition period):
 *   - BusinessMember.role  = 'OWNER'   (legacy enum column — kept for backward compat)
 *   - BusinessMember.roleId = ownerRole.id  (new RBAC column)
 *
 * Only call from server-side code after validating the user is authenticated.
 */
export async function createBusiness(
  userId: string,
  input: CreateBusinessInput
): Promise<CreateBusinessResult> {
  const slug = await generateUniqueSlug(input.name);

  return prisma.$transaction(async (tx) => {
    // 1. Create the business
    const business = await tx.business.create({
      data: {
        name: input.name,
        slug,
        industryTemplateId: input.industryTemplateId,
        description: input.description ?? null,
      },
    });

    // 2. Create the three system roles for this business
    const roleNames = ['OWNER', 'ADMIN', 'MEMBER'] as const;
    const roleDescriptions: Record<string, string> = {
      OWNER: 'Full access to all business resources. Permissions cannot be modified.',
      ADMIN: 'Administrative access. Permissions can be customized by the Owner.',
      MEMBER: 'Basic access. Permissions can be customized by the Owner.',
    };
    
    const createdRoles: Record<string, string> = {}; // name → id

    for (const roleName of roleNames) {
      const role = await tx.role.create({
        data: {
          name: roleName,
          description: roleDescriptions[roleName],
          businessId: business.id,
          isSystem: true,
          isDefault: true,
        },
      });
      createdRoles[roleName] = role.id;
    }

    // 3. Assign permissions to each system role
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

    // 4. Create the OWNER membership (dual-write)
    const member = await tx.businessMember.create({
      data: {
        userId,
        businessId: business.id,
        role: 'OWNER',               // legacy enum — preserved
        roleId: createdRoles['OWNER'], // RBAC FK — new
      },
    });

    // 5. Audit log: role.created (for all three system roles)
    for (const roleName of roleNames) {
      await AuditService.record({
        action: 'role.created' as AuditActionType,
        resourceType: 'Role' as AuditResourceTypeType,
        resourceId: createdRoles[roleName],
        actorType: 'USER',
        actorUserId: userId,
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

    // 6. Audit log: business.created
    await AuditService.record({
        action: 'business.created' as AuditActionType,
        resourceType: 'Business' as AuditResourceTypeType,
        resourceId: business.id,
        actorType: 'USER',
        actorUserId: userId,
        businessId: business.id,
        severity: 'INFO',
        summary: `System event ${'business.created'}`,
        metadata: { name: business.name, slug: business.slug },
      
      }, tx)

    // 7. Audit log: business_member.created
    await AuditService.record({
        action: 'business_member.created' as AuditActionType,
        resourceType: 'BusinessMember' as AuditResourceTypeType,
        resourceId: member.id,
        actorType: 'USER',
        actorUserId: userId,
        businessId: business.id,
        severity: 'INFO',
        summary: `System event ${'business_member.created'}`,
        metadata: { role: 'OWNER', roleId: createdRoles['OWNER'], userId },
      
      }, tx)

    return { ...business, memberId: member.id };
  });
}
