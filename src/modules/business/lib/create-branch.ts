 

import type { AuditActionType, AuditResourceTypeType } from '@atlas/core';
import { AuditService } from '@/lib/audit/audit-service';
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

    await AuditService.record({
        action: 'branch.created' as AuditActionType,
        resourceType: 'Branch' as AuditResourceTypeType,
        resourceId: branch.id,
        actorType: 'USER',
        actorUserId: userId,
        businessId: input.businessId,
        severity: 'INFO',
        summary: `System event ${'branch.created'}`,
        metadata: { name: branch.name, address: branch.address },
      
      }, tx)

    return branch;
  });
}
