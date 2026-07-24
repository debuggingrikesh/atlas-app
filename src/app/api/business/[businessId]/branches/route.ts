import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
 

import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core';
import { createBranch } from '@/modules/business/lib/create-branch';
import { createBranchSchema } from '@/lib/validators/business';
import { successResponse, errorResponse } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';

interface Params {
  params: Promise<{ businessId: string }>;
}

/**
 * POST /api/business/[businessId]/branches
 * Creates a branch. Requires ADMIN or OWNER role.
 */
async function POST_handler(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId } = await params;

  // Requires 'branch.create' permission — held by OWNER and ADMIN system roles
  const { errorRes: memberError } = await requirePermission(user.id, businessId, PERMISSIONS.branch.create);
  if (memberError) return memberError;

  try {
    const body = await request.json();
    const result = createBranchSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        result.error.issues[0]?.message ?? 'Invalid input.',
        400
      );
    }

    const branch = await createBranch(user.id, {
      ...result.data,
      businessId,
    });

    return successResponse({ branch }, 201);
  } catch (err) {
    logger.error({ message: 'API Error', context: '[branches POST] Unexpected error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create branch. Please try again.', 500);
  }
}

/**
 * GET /api/business/[businessId]/branches
 * Lists all branches for a business. Requires membership.
 */
async function GET_handler(_request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId } = await params;

  // Requires basic 'business.read' permission — held by all members
  const { errorRes: memberError } = await requirePermission(user.id, businessId, PERMISSIONS.business.read);
  if (memberError) return memberError;

  try {
    const branches = await prisma.branch.findMany({
      where: { businessId },
      orderBy: { createdAt: 'asc' },
    });

    return successResponse({ branches });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[branches GET] Unexpected error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export const GET = withErrorHandling(GET_handler, 'GET /api/business/[businessId]/branches');

export const POST = withErrorHandling(POST_handler, 'POST /api/business/[businessId]/branches');
