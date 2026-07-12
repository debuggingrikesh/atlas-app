import { prisma } from '@/lib/db/prisma';
import { generateUniqueSlug } from './generate-slug';
import type { CreateBusinessInput, Business } from '@/modules/business/types';

type CreateBusinessResult = Business & {
  memberId: string;
};

/**
 * Creates a Business, its OWNER BusinessMember record, and an AuditLog entry
 * inside a single Prisma transaction.
 *
 * Only call this from server-side code after validating the user is authenticated.
 * Never call from page components directly.
 */
export async function createBusiness(
  userId: string,
  input: CreateBusinessInput
): Promise<CreateBusinessResult> {
  const slug = await generateUniqueSlug(input.name);

  return prisma.$transaction(async (tx) => {
    // 1. Create the business
    const business = await tx.business.create({
      data: {
        name: input.name,
        slug,
        industryTemplateId: input.industryTemplateId,
        description: input.description ?? null,
      },
    });

    // 2. Create the OWNER membership
    const member = await tx.businessMember.create({
      data: {
        userId,
        businessId: business.id,
        role: 'OWNER',
      },
    });

    // 3. Audit log: business.created
    await tx.auditLog.create({
      data: {
        action: 'business.created',
        entityType: 'Business',
        entityId: business.id,
        actorId: userId,
        businessId: business.id,
        metadata: { name: business.name, slug: business.slug },
      },
    });

    // 4. Audit log: business_member.created
    await tx.auditLog.create({
      data: {
        action: 'business_member.created',
        entityType: 'BusinessMember',
        entityId: member.id,
        actorId: userId,
        businessId: business.id,
        metadata: { role: 'OWNER', userId },
      },
    });

    return { ...business, memberId: member.id };
  });
}
