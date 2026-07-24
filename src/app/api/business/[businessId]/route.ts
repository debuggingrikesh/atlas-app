import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
 

import type { AuditActionType, AuditResourceTypeType } from '@atlas/core';
import { AuditService } from '@/lib/audit/audit-service';
import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core';
import { getBusiness } from '@/modules/business/lib/get-business';
import { updateBusiness } from '@/modules/business/lib/update-business';
import { updateBusinessSchema } from '@/lib/validators/business';
import { successResponse, errorResponse } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';

interface Params {
  params: Promise<{ businessId: string }>;
}

/**
 * GET /api/business/[businessId]
 * Returns a single business. Requires membership.
 */
async function GET_handler(_request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId } = await params;

  // Requires basic 'business.read' permission — held by all members
  const { errorRes: memberError } = await requirePermission(user.id, businessId, PERMISSIONS.business.read);
  if (memberError) return memberError;

  try {
    const business = await getBusiness(businessId);
    if (!business) {
      return errorResponse('NOT_FOUND', 'Business not found.', 404);
    }
    return successResponse({ business });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[business/:id GET] Unexpected error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

/**
 * PATCH /api/business/[businessId]
 * Partially updates a business (name, description).
 * Requires ADMIN or OWNER role.
 * Runs inside a Prisma transaction and writes an AuditLog entry.
 */
async function PATCH_handler(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId } = await params;

  // Requires 'business.update' permission — held by OWNER and ADMIN system roles
  const { errorRes: memberError } = await requirePermission(user.id, businessId, PERMISSIONS.business.update);
  if (memberError) return memberError;

  try {
    const body = await request.json();
    const result = updateBusinessSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        result.error.issues[0]?.message ?? 'Invalid input.',
        400
      );
    }

    const business = await updateBusiness(user.id, businessId, result.data);
    return successResponse({ business });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[business/:id PATCH] Unexpected error:', route: 'API' }, err);
    if (err instanceof Error && err.message.includes('409: Conflict')) {
      return errorResponse('CONFLICT', 'The business was updated by someone else. Please refresh and try again.', 409);
    }
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

/**
 * DELETE /api/business/[businessId]
 * Soft deletes a business.
 * Requires OWNER role ('business.delete' permission).
 */
async function DELETE_handler(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId } = await params;

  // Requires 'business.delete' permission — held by OWNER
  const { errorRes: memberError } = await requirePermission(user.id, businessId, PERMISSIONS.business.delete);
  if (memberError) return memberError;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.business.update({
        where: { id: businessId },
        data: { deletedAt: new Date() },
      });

      await AuditService.record({
        action: 'business.deleted' as AuditActionType,
        resourceType: 'Business' as AuditResourceTypeType,
        resourceId: businessId,
        actorType: 'USER',
        actorUserId: user.id,
        businessId: businessId,
        severity: 'INFO',
        summary: `System event ${'business.deleted'}`,
        metadata: { deletedAt: new Date() },
        
      }, tx)
    });

    return successResponse({ success: true }, 200);
  } catch (err) {
    logger.error({ message: 'API Error', context: '[business/:id DELETE] Unexpected error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export const GET = withErrorHandling(GET_handler, 'GET /api/business/[businessId]');

export const PATCH = withErrorHandling(PATCH_handler, 'PATCH /api/business/[businessId]');

export const DELETE = withErrorHandling(DELETE_handler, 'DELETE /api/business/[businessId]');
