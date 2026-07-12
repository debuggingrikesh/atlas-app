import { requireAuth } from '@/lib/auth/require-auth';
import { createBusiness } from '@/modules/business/lib/create-business';
import { getUserBusinesses } from '@/modules/business/lib/get-user-businesses';
import { createBusinessSchema } from '@/lib/validators/business';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * POST /api/business
 * Creates a new business for the authenticated user.
 */
export async function POST(request: Request) {
  const { user, errorRes } = await requireAuth();
  if (errorRes) return errorRes;

  try {
    const body = await request.json();
    const result = createBusinessSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        result.error.issues[0]?.message ?? 'Invalid input.',
        400
      );
    }

    const business = await createBusiness(user.id, result.data);

    return successResponse({ business }, 201);
  } catch (err) {
    console.error('[business POST] Unexpected error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create business. Please try again.', 500);
  }
}

/**
 * GET /api/business
 * Lists all businesses the authenticated user is a member of.
 */
export async function GET() {
  const { user, errorRes } = await requireAuth();
  if (errorRes) return errorRes;

  try {
    const businesses = await getUserBusinesses(user.id);
    return successResponse({ businesses });
  } catch (err) {
    console.error('[business GET] Unexpected error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
