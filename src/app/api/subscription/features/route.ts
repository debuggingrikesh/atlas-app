import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { requireAuth } from '@/lib/auth/require-auth';
import { successResponse, errorResponse } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';

async function GET_handler() {
  const { errorRes: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      include: { features: true }
    });

    return successResponse({ plans });
  } catch (err: any) {
    logger.error({ message: 'API Error', context: '[subscription/features GET] error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export const GET = withErrorHandling(GET_handler, 'GET /api/subscription/features');
