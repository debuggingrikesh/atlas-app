 

import { prisma } from '@/lib/db/prisma';

export async function getBusinessMembers(businessId: string) {
  const members = await prisma.businessMember.findMany({
    where: { businessId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      rbacRole: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return members;
}
