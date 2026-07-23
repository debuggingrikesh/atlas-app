 

import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { getUserProfile } from '@/modules/auth/lib/get-user-profile';
import { getActiveBusiness } from '@/lib/auth/get-active-business';
import { resolvePermissions } from '@/lib/permissions/resolve-permissions';
import { PERMISSIONS } from '@atlas/core/auth';
import { RoleEditorModal } from '@/modules/roles/components/RoleEditorModal';
import { RoleActions } from '@/modules/roles/components/RoleActions';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Roles & Permissions — Atlas',
  description: 'Manage roles and permissions for your business.',
};

export default async function RolesSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const profile = await getUserProfile(user.id);
  const activeBusiness = (await getActiveBusiness(profile!.businesses))!;
  
  const perms = resolvePermissions(activeBusiness);
  if (!perms.hasPermission(PERMISSIONS.role.read)) {
    redirect(`/dashboard/${activeBusiness.slug}`);
  }
  
  const roles = await prisma.role.findMany({
    where: { businessId: activeBusiness.id },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: { members: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const systemRoles = roles.filter(r => r.isSystem).sort((a, b) => {
    const order = { 'OWNER': 1, 'ADMIN': 2, 'MEMBER': 3 };
    return (order[a.name as keyof typeof order] || 4) - (order[b.name as keyof typeof order] || 4);
  });
  const customRoles = roles.filter(r => !r.isSystem);

  const canManageRoles = perms.hasPermission(PERMISSIONS.role.manage);

  return (
    <div className="container max-w-5xl py-10 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View the roles and permissions available in {activeBusiness.name}.
          </p>
        </div>
        
        {canManageRoles && (
          <RoleEditorModal businessId={activeBusiness.id} />
        )}
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="grid grid-cols-12 gap-4 border-b p-4 text-sm font-medium text-muted-foreground bg-muted/40 rounded-t-xl">
          <div className="col-span-5">Role</div>
          <div className="col-span-2 text-center">Users</div>
          <div className="col-span-3 text-center">Type</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        
        <div className="divide-y">
          {[...systemRoles, ...customRoles].map((role, index) => {
            const isFirstCustom = !role.isSystem && index === systemRoles.length;
            return (
              <div key={role.id} className="relative">
                {isFirstCustom && (
                  <div className="absolute inset-x-0 -top-px h-px bg-border/50" />
                )}
                <div className={`grid grid-cols-12 items-center gap-4 p-4 transition-colors hover:bg-muted/30 ${isFirstCustom ? 'bg-muted/10' : ''}`}>
                  <div className="col-span-5">
                    <p className="font-semibold">{role.name}</p>
                    <p className="text-sm text-muted-foreground truncate" title={role.description || ''}>
                      {role.description || 'No description'}
                    </p>
                  </div>
                  <div className="col-span-2 text-center text-sm font-medium">
                    {role._count.members}
                  </div>
                  <div className="col-span-3 text-center">
                    <Badge variant={role.isSystem ? 'secondary' : 'outline'}>
                      {role.isSystem ? 'System' : 'Custom'}
                    </Badge>
                  </div>
                  <div className="col-span-2 flex justify-end items-center gap-2">
                    {canManageRoles && (
                      <>
                        <RoleEditorModal businessId={activeBusiness.id} role={role} />
                        {!role.isSystem && (
                          <RoleActions businessId={activeBusiness.id} roleId={role.id} roleName={role.name} />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {customRoles.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground bg-muted/10">
              No custom roles created yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
