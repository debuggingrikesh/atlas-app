import { requireAuth } from '@/lib/auth/require-auth';
import { requireBusinessMember } from '@/lib/auth/require-business-member';
import { getBusiness } from '@/modules/business/lib/get-business';
import { successResponse, errorResponse } from '@/lib/api/response';

interface Params {
  params: Promise<{ businessId: string }>;
}

/**
 * GET /api/business/[businessId]
 * Returns a single business. Requires membership.
 */
export async function GET(_request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId } = await params;

  const { errorRes: memberError } = await requireBusinessMember(user.id, businessId);
  if (memberError) return memberError;

  try {
    const business = await getBusiness(businessId);
    if (!business) {
      return errorResponse('NOT_FOUND', 'Business not found.', 404);
    }
    return successResponse({ business });
  } catch (err) {
    console.error('[business/:id GET] Unexpected error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
