/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from '@/lib/db/prisma';
import type { Invitation } from '../types';

export async function getInvitations(businessId: string): Promise<Invitation[]> {
  const now = new Date();
  
  const invitations = await prisma.invitation.findMany({
    where: {
      businessId,
      status: 'PENDING',
      expiresAt: {
        gt: now, // Lazy expiration: only return those strictly in the future
      },
    },
    include: {
      role: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return invitations;
}
