import { prisma } from '@/lib/db/prisma';
import { successResponse, errorResponse } from '@/lib/api/response';
import { z } from 'zod';

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

interface Params {
  params: Promise<{ userId: string }>;
}

/**
 * PATCH /api/admin/users/[userId]/status
 * Globally activates or deactivates a user account.
 * Requires ADMIN_SECRET header for authorization.
 */
export async function PATCH(request: Request, { params }: Params) {
  // 1. Authorize Admin
  const authHeader = request.headers.get('Authorization');
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return errorResponse('UNAUTHORIZED', 'Invalid or missing admin credentials.', 401);
  }

  const { userId } = await params;

  try {
    // 2. Validate input
    const body = await request.json();
    const result = updateStatusSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        result.error.issues[0]?.message ?? 'Invalid input.',
        400
      );
    }

    const { isActive } = result.data;

    // 3. Execute update and audit log in a transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.userProfile.update({
        where: { id: userId },
        data: { isActive },
      });

      await tx.auditLog.create({
        data: {
          action: isActive ? 'USER_REACTIVATED' : 'USER_DEACTIVATED',
          entityType: 'UserProfile',
          entityId: userId,
          actorId: 'system-admin', // Or we could parse the admin's identity if applicable
          businessId: null, // Global action, no business context
          metadata: { isActive },
        },
      });

      return user;
    });

    return successResponse({ user: updatedUser });
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'P2025') {
      return errorResponse('NOT_FOUND', 'User not found.', 404);
    }
    console.error('[Admin Update User Status] Unexpected error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to update user status.', 500);
  }
}
