 

import { prisma } from '../src/lib/db/prisma';
import { SYSTEM_ROLE_PERMISSIONS } from '@atlas/core/auth';

async function main() {
  console.log('Starting permission backfill...');

  // Ensure all permissions from the system exist in the DB
  const allPermissions = Array.from(new Set([
    ...SYSTEM_ROLE_PERMISSIONS.OWNER,
    ...SYSTEM_ROLE_PERMISSIONS.ADMIN,
    ...SYSTEM_ROLE_PERMISSIONS.MEMBER,
  ]));

  for (const permKey of allPermissions) {
    await prisma.permission.upsert({
      where: { key: permKey },
      update: {},
      create: {
        key: permKey,
        description: `Auto-backfilled permission: ${permKey}`,
        category: permKey.split('.')[0],
      },
    });
  }

  const permMap = new Map();
  const perms = await prisma.permission.findMany();
  for (const p of perms) {
    permMap.set(p.key, p.id);
  }

  // Find all ADMIN roles and add missing permissions
  const adminRoles = await prisma.role.findMany({
    where: { name: 'ADMIN' },
  });

  for (const role of adminRoles) {
    for (const permKey of SYSTEM_ROLE_PERMISSIONS.ADMIN) {
      const pid = permMap.get(permKey);
      if (!pid) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: pid,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: pid,
        },
      });
    }
  }
  
  // Find all OWNER roles and add missing permissions
  const ownerRoles = await prisma.role.findMany({
    where: { name: 'OWNER' },
  });

  for (const role of ownerRoles) {
    for (const permKey of SYSTEM_ROLE_PERMISSIONS.OWNER) {
      const pid = permMap.get(permKey);
      if (!pid) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: pid,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: pid,
        },
      });
    }
  }

  // Same for MEMBER
  const memberRoles = await prisma.role.findMany({
    where: { name: 'MEMBER' },
  });

  for (const role of memberRoles) {
    for (const permKey of SYSTEM_ROLE_PERMISSIONS.MEMBER) {
      const pid = permMap.get(permKey);
      if (!pid) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: pid,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: pid,
        },
      });
    }
  }

  console.log('Backfill complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
