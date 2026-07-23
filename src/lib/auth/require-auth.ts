/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@/lib/supabase/server';
import { errorResponse } from '@/lib/api/response';
import type { AuthUser } from '@/modules/auth/types';
import { prisma } from '@/lib/db/prisma';
import { PlatformRole, UserProfile } from '@prisma/client';

/**
 * Validates the current Supabase session and returns the authenticated user.
 * Throws an UNAUTHORIZED error response if no valid session exists,
 * and a FORBIDDEN error response if the user account is deactivated.
 *
 * Usage in API route handlers:
 *   const { user, errorRes } = await requireAuth();
 *   if (errorRes) return errorRes;
 */
export async function requireAuth(): Promise<
  | { user: AuthUser; errorRes: null }
  | { user: null; errorRes: ReturnType<typeof errorResponse> }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      errorRes: errorResponse('UNAUTHORIZED', 'Authentication required.', 401),
    };
  }

  const userProfile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { isActive: true }
  });

  if (userProfile && !userProfile.isActive) {
    return {
      user: null,
      errorRes: errorResponse('FORBIDDEN', 'Your account has been deactivated.', 403),
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? '',
      emailConfirmedAt: user.email_confirmed_at ?? null,
    },
    errorRes: null,
  };
}

export async function requirePlatformRole(allowedRoles: PlatformRole[]): Promise<
  | { user: AuthUser; userProfile: UserProfile; errorRes: null }
  | { user: null; userProfile: null; errorRes: ReturnType<typeof errorResponse> }
> {
  const { user, errorRes } = await requireAuth();
  if (errorRes) return { user: null, userProfile: null, errorRes };

  const userProfile = await prisma.userProfile.findUnique({
    where: { id: user.id },
  });

  if (!userProfile) {
    return {
      user: null,
      userProfile: null,
      errorRes: errorResponse('UNAUTHORIZED', 'Profile not found.', 401),
    };
  }

  if (userProfile.platformRole === 'NONE' || !allowedRoles.includes(userProfile.platformRole)) {
    return {
      user: null,
      userProfile: null,
      errorRes: errorResponse('FORBIDDEN', 'Insufficient platform privileges.', 403),
    };
  }

  return { user, userProfile, errorRes: null };
}
