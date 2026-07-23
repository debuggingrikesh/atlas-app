import { logger } from '@/lib/logger';
 

import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core/auth';
import { removeMember } from '@/modules/team/lib/remove-member';
import { updateMemberRole } from '@/modules/team/lib/update-member-role';
import { updateMemberRoleSchema } from '@/modules/team/validators';
import { successResponse, errorResponse } from '@/lib/api/response';

interface Params {
  params: Promise<{ businessId: string; memberId: string }>;
}

/**
 * DELETE /api/business/[businessId]/members/[memberId]
 * Removes a member from the business.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId, memberId } = await params;
  const { errorRes: permError } = await requirePermission(user.id, businessId, PERMISSIONS.member.remove);
  if (permError) return permError;

  try {
    const { errorRes } = await removeMember(user.id, businessId, memberId);
    if (errorRes) return errorRes;

    return successResponse({ success: true });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[members DELETE] Error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'Failed to remove member.', 500);
  }
}

/**
 * PATCH /api/business/[businessId]/members/[memberId]
 * Updates a member's role.
 */
export async function PATCH(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId, memberId } = await params;
  const { errorRes: permError } = await requirePermission(user.id, businessId, PERMISSIONS.role.manage);
  if (permError) return permError;

  try {
    const body = await request.json();
    const result = updateMemberRoleSchema.safeParse(body);

    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Invalid input.', 400);
    }

    const { errorRes } = await updateMemberRole(user.id, businessId, memberId, result.data.roleId, result.data.version);
    if (errorRes) return errorRes;

    return successResponse({ success: true });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[members PATCH] Error:', route: 'API' }, err);
    if (err instanceof Error && err.message.includes('409: Conflict')) {
      return errorResponse('CONFLICT', 'The member was updated by someone else. Please refresh and try again.', 409);
    }
    return errorResponse('INTERNAL_ERROR', 'Failed to update member role.', 500);
  }
}
