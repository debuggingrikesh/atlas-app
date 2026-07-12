import { prisma } from '@/lib/db/prisma';
import { errorResponse } from '@/lib/api/response';
import type { MemberRole } from '@prisma/client';

const ROLE_HIERARCHY: Record<MemberRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
};

/**
 * Verifies that the given user is a member of the given business,
 * and that their role meets the minimum required role.
 *
 * Usage in API route handlers:
 *   const { member, errorRes } = await requireBusinessMember(userId, businessId, 'ADMIN');
 *   if (errorRes) return errorRes;
 */
export async function requireBusinessMember(
  userId: string,
  businessId: string,
  minRole: MemberRole = 'MEMBER'
): Promise<
  | { member: { role: MemberRole }; errorRes: null }
  | { member: null; errorRes: ReturnType<typeof errorResponse> }
> {
  const membership = await prisma.businessMember.findUnique({
    where: {
      userId_businessId: { userId, businessId },
    },
    select: { role: true },
  });

  if (!membership) {
    // Return NOT_FOUND to avoid leaking business existence to non-members
    return {
      member: null,
      errorRes: errorResponse('NOT_FOUND', 'Business not found.', 404),
    };
  }

  if (ROLE_HIERARCHY[membership.role] < ROLE_HIERARCHY[minRole]) {
    return {
      member: null,
      errorRes: errorResponse(
        'FORBIDDEN',
        'You do not have permission to perform this action.',
        403
      ),
    };
  }

  return { member: { role: membership.role }, errorRes: null };
}
