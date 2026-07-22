import { AuditService } from '@/lib/audit/audit-service';
import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { successResponse, errorResponse } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';
import { PERMISSIONS } from '@atlas/core/auth';

interface Params {
  params: Promise<{ businessId: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId } = await params;

  // Only users with role.manage can create roles
  const { errorRes: permError } = await requirePermission(user.id, businessId, PERMISSIONS.role.manage);
  if (permError) return permError;

  try {
    const body = await request.json();
    const { name, permissions } = body;

    if (!name || typeof name !== 'string') {
      return errorResponse('VALIDATION_ERROR', 'Role name is required.', 400);
    }

    if (!Array.isArray(permissions)) {
      return errorResponse('VALIDATION_ERROR', 'Permissions must be an array.', 400);
    }

    // Check if role already exists in this business
    const existing = await prisma.role.findUnique({
      where: {
        businessId_name: {
          businessId,
          name,
        },
      },
    });

    if (existing) {
      return errorResponse('CONFLICT', 'A role with this name already exists.', 409);
    }

    // Lookup permission records
    const dbPermissions = await prisma.permission.findMany({
      where: { key: { in: permissions } },
      select: { id: true },
    });

    // Create role and assign permissions in a transaction
    const role = await prisma.$transaction(async (tx) => {
      const createdRole = await tx.role.create({
        data: {
          name,
          businessId,
          isSystem: false,
        },
      });

      if (dbPermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: dbPermissions.map((p) => ({
            roleId: createdRole.id,
            permissionId: p.id,
          })),
        });
      }

      await AuditService.record({
        action: 'role.created' as any,
        resourceType: 'Role' as any,
        resourceId: createdRole.id,
        actorType: 'USER',
        actorUserId: user.id,
        businessId: undefined,
        severity: 'INFO',
        summary: `System event ${'role.created'}`,
        metadata: { name, permissions },
        
      }, tx)

      return createdRole;
    });

    return successResponse({ role }, 201);
  } catch (err) {
    console.error('[roles POST] Error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create role.', 500);
  }
}
