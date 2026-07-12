import { requireAuth } from '@/lib/auth/require-auth';
import { requireBusinessMember } from '@/lib/auth/require-business-member';
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
export async function POST(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId } = await params;

  const { errorRes: memberError } = await requireBusinessMember(user.id, businessId, 'ADMIN');
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
    console.error('[branches POST] Unexpected error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create branch. Please try again.', 500);
  }
}

/**
 * GET /api/business/[businessId]/branches
 * Lists all branches for a business. Requires membership.
 */
export async function GET(_request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId } = await params;

  const { errorRes: memberError } = await requireBusinessMember(user.id, businessId);
  if (memberError) return memberError;

  try {
    const branches = await prisma.branch.findMany({
      where: { businessId },
      orderBy: { createdAt: 'asc' },
    });

    return successResponse({ branches });
  } catch (err) {
    console.error('[branches GET] Unexpected error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
