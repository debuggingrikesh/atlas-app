import { logger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/api/handler';

import { requireAuth } from '@/lib/auth/require-auth';
import { createBusiness } from '@/modules/business/lib/create-business';
import { getUserBusinesses } from '@/modules/business/lib/get-user-businesses';
import { createBusinessSchema } from '@/lib/validators/business';
import { successResponse, errorResponse } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/business
 * Creates a new business for the authenticated user.
 * Note: This is a user-scoped endpoint (pre-tenant), so it does not require a businessId check.
 */
export const POST = withErrorHandling(async function POST(request: Request) {
  const { user, errorRes } = await requireAuth();
  if (errorRes) return errorRes;

  const body = await request.json();
  const result = createBusinessSchema.safeParse(body);

  if (!result.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      result.error.issues[0]?.message ?? 'Invalid input.',
      400
    );
  }

  const template = await prisma.industryTemplate.findUnique({
    where: { id: result.data.industryTemplateId },
    select: { isActive: true },
  });

  if (!template || !template.isActive) {
    return errorResponse('VALIDATION_ERROR', 'Invalid or inactive industry template.', 400);
  }

  const business = await createBusiness(user.id, result.data);

  return successResponse({ business }, 201);
}, 'POST /api/business');

/**
 * GET /api/business
 * Lists all businesses the authenticated user is a member of.
 * Note: This is a user-scoped endpoint (pre-tenant).
 */
export const GET = withErrorHandling(async function GET(request: Request) {
  const { user, errorRes } = await requireAuth();
  if (errorRes) return errorRes;

  const businesses = await getUserBusinesses(user.id);
  return successResponse({ businesses });
}, 'GET /api/business');
