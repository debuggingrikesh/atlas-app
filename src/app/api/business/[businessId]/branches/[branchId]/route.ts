import { logger } from '@/lib/logger';
 

import type { AuditActionType, AuditResourceTypeType } from '@atlas/core/audit';
import { AuditService } from '@/lib/audit/audit-service';
import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core/auth';
import { successResponse, errorResponse } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

interface Params {
  params: Promise<{ businessId: string; branchId: string }>;
}

const updateBranchSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  address: z.string().max(255).trim().nullable().optional(),
  isActive: z.boolean().optional(),
});

/**
 * PATCH /api/business/[businessId]/branches/[branchId]
 * Updates a branch name, address, or active status. Requires branch.update permission.
 */
export async function PATCH(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId, branchId } = await params;
  const { errorRes: permError } = await requirePermission(user.id, businessId, PERMISSIONS.branch.update);
  if (permError) return permError;

  try {
    const body = await request.json();
    const result = updateBranchSchema.safeParse(body);

    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Invalid input.', 400);
    }

    // Verify branch belongs to this business
    const existing = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!existing || existing.businessId !== businessId) {
      return errorResponse('NOT_FOUND', 'Branch not found.', 404);
    }

    const branch = await prisma.$transaction(async (tx) => {
      const updated = await tx.branch.update({
        where: { id: branchId },
        data: {
          ...(result.data.name !== undefined && { name: result.data.name }),
          ...(result.data.address !== undefined && { address: result.data.address }),
          ...(result.data.isActive !== undefined && { isActive: result.data.isActive }),
        },
      });

      await AuditService.record({
        action: 'branch.updated' as AuditActionType,
        resourceType: 'Branch' as AuditResourceTypeType,
        resourceId: branchId,
        actorType: 'USER',
        actorUserId: user.id,
        businessId: undefined,
        severity: 'INFO',
        summary: `System event ${'branch.updated'}`,
        metadata: {
            changes: result.data,
            previous: {
              name: existing.name,
              address: existing.address,
              isActive: existing.isActive,
            },
          },
        
      }, tx)

      return updated;
    });

    return successResponse({ branch });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[branches PATCH] Unexpected error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'Failed to update branch.', 500);
  }
}
