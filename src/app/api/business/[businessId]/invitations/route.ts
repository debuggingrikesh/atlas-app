import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core/auth';
import { createInvitationSchema } from '@/modules/invitations/validators';
import { createInvitation } from '@/modules/invitations/lib/create-invitation';
import { getInvitations } from '@/modules/invitations/lib/get-invitations';
import { successResponse, errorResponse } from '@/lib/api/response';

interface Params {
  params: Promise<{ businessId: string }>;
}

/**
 * POST /api/business/[businessId]/invitations
 */
export async function POST(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId } = await params;
  const { errorRes: permError } = await requirePermission(user.id, businessId, PERMISSIONS.member.invite);
  if (permError) return permError;

  try {
    const body = await request.json();
    const result = createInvitationSchema.safeParse(body);

    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Invalid input.', 400);
    }

    const { invitation, rawToken, errorRes } = await createInvitation(user.id, businessId, result.data);
    if (errorRes) return errorRes;

    // Never expose raw token in production API responses
    const isDev = process.env.NODE_ENV === 'development';
    return successResponse(
      { invitation, ...(isDev && rawToken ? { rawToken } : {}) },
      201
    );
  } catch (err) {
    console.error('[invitations POST] Error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create invitation.', 500);
  }
}

/**
 * GET /api/business/[businessId]/invitations
 */
export async function GET(_request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId } = await params;
  const { errorRes: permError } = await requirePermission(user.id, businessId, PERMISSIONS.member.read);
  if (permError) return permError;

  try {
    const invitations = await getInvitations(businessId);
    return successResponse({ invitations });
  } catch (err) {
    console.error('[invitations GET] Error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch invitations.', 500);
  }
}
