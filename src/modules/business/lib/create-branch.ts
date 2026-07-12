import { prisma } from '@/lib/db/prisma';
import type { CreateBranchInput, Branch } from '@/modules/business/types';

/**
 * Creates a Branch for the given business and writes an AuditLog entry.
 * Always pass businessId explicitly — never trust the client to scope data.
 */
export async function createBranch(
  userId: string,
  input: CreateBranchInput
): Promise<Branch> {
  return prisma.$transaction(async (tx) => {
    const branch = await tx.branch.create({
      data: {
        name: input.name,
        businessId: input.businessId,
        address: input.address ?? null,
      },
    });

    await tx.auditLog.create({
      data: {
        action: 'branch.created',
        entityType: 'Branch',
        entityId: branch.id,
        actorId: userId,
        businessId: input.businessId,
        metadata: { name: branch.name, address: branch.address },
      },
    });

    return branch;
  });
}
