import { requireAuth } from '@/lib/auth/require-auth';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { successResponse, errorResponse } from '@/lib/api/response';
import { z } from 'zod';

const draftSchema = z.object({
  step: z.number().int().min(1).max(4),
  data: z.any().nullable().optional(),
});

/**
 * GET /api/onboarding/draft
 * Fetches the user's current onboarding draft state.
 */
export async function GET() {
  const { user, errorRes } = await requireAuth();
  if (errorRes) return errorRes;

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      select: { onboardingStep: true, onboardingData: true },
    });

    return successResponse({
      step: profile?.onboardingStep ?? 1,
      data: profile?.onboardingData ?? null,
    });
  } catch (err) {
    console.error('[onboarding/draft GET] Unexpected error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch draft.', 500);
  }
}

/**
 * POST /api/onboarding/draft
 * Upserts the user's onboarding progress.
 */
export async function POST(request: Request) {
  const { user, errorRes } = await requireAuth();
  if (errorRes) return errorRes;

  try {
    const body = await request.json();
    const result = draftSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        result.error.issues[0]?.message ?? 'Invalid input.',
        400
      );
    }

    const { step, data } = result.data;

    // We pass undefined if data is not provided, allowing partial updates if needed,
    // though Prisma requires explicitly setting Json to Prisma.DbNull to clear it.
    const onboardingDataValue = data === null ? Prisma.DbNull : data === undefined ? undefined : data;

    const profile = await prisma.userProfile.upsert({
      where: { id: user.id },
      update: { onboardingStep: step, onboardingData: onboardingDataValue },
      create: {
        id: user.id,
        email: user.email,
        onboardingStep: step,
        onboardingData: data ?? Prisma.DbNull,
      },
    });

    return successResponse({ step: profile.onboardingStep, data: profile.onboardingData });
  } catch (err) {
    console.error('[onboarding/draft POST] Unexpected error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to save draft.', 500);
  }
}
