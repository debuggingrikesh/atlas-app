'use server';

import { prisma } from '@/lib/db/prisma';
import { requirePlatformRole } from '@/lib/auth/require-auth';
import { revalidatePath } from 'next/cache';

export async function changeSubscriptionPlan(businessId: string, planCode: string) {
  const { errorRes } = await requirePlatformRole(['SUPER_ADMIN']);
  if (errorRes) {
    throw new Error('Unauthorized');
  }

  const plan = await prisma.plan.findUnique({
    where: { code: planCode }
  });

  if (!plan) {
    throw new Error('Plan not found');
  }

  await prisma.businessSubscription.upsert({
    where: { businessId },
    create: {
      businessId,
      planId: plan.id,
      status: 'ACTIVE'
    },
    update: {
      planId: plan.id,
      status: 'ACTIVE'
    }
  });

  revalidatePath(`/control-center/tenants/${businessId}`);
  revalidatePath(`/dashboard`);
}
