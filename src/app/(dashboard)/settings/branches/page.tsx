/* eslint-disable @typescript-eslint/no-explicit-any */

import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { getUserProfile } from '@/modules/auth/lib/get-user-profile';
import { getActiveBusiness } from '@/lib/auth/get-active-business';
import { resolvePermissions } from '@/lib/permissions/resolve-permissions';
import { PERMISSIONS } from '@atlas/core/auth';
import { CreateBranchForm } from './CreateBranchForm';
import { BranchActions } from './BranchActions';

export const metadata: Metadata = {
  title: 'Branches — Atlas',
  description: 'Manage your business locations.',
};

export default async function BranchesSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const profile = await getUserProfile(user.id);
  const activeBusiness = (await getActiveBusiness(profile!.businesses))!;

  const perms = resolvePermissions(activeBusiness);
  if (!perms.hasPermission(PERMISSIONS.branch.read)) {
    redirect(`/dashboard/${activeBusiness.slug}`);
  }

  const branches = await prisma.branch.findMany({
    where: { businessId: activeBusiness.id },
    orderBy: { createdAt: 'asc' },
  });

  // Determine if the current user has branch.update permission
  const membership = await prisma.businessMember.findUnique({
    where: { userId_businessId: { userId: user.id, businessId: activeBusiness.id } },
    select: {
      role: true,
      rbacRole: {
        select: {
          name: true,
          permissions: {
            where: { permission: { key: 'branch.update' } },
            select: { id: true },
          },
        },
      },
    },
  });
  
  const isOwnerEdit = membership?.role === 'OWNER' || membership?.rbacRole?.name === 'OWNER';
  const isAdminFallbackEdit = membership?.rbacRole === null && membership?.role === 'ADMIN';
  const hasBranchUpdate = (membership?.rbacRole?.permissions?.length ?? 0) > 0;
  const canEdit = isOwnerEdit || isAdminFallbackEdit || hasBranchUpdate;

  // Development logging requested by user


  const canCreateMember = await prisma.businessMember.findUnique({
    where: { userId_businessId: { userId: user.id, businessId: activeBusiness.id } },
    select: {
      role: true,
      rbacRole: {
        select: {
          name: true,
          permissions: {
            where: { permission: { key: 'branch.create' } },
            select: { id: true },
          },
        },
      },
    },
  });
  
  const isOwnerCreate = canCreateMember?.role === 'OWNER' || canCreateMember?.rbacRole?.name === 'OWNER';
  const isAdminFallbackCreate = canCreateMember?.rbacRole === null && canCreateMember?.role === 'ADMIN';
  const hasBranchCreate = (canCreateMember?.rbacRole?.permissions?.length ?? 0) > 0;
  const canCreate = isOwnerCreate || isAdminFallbackCreate || hasBranchCreate;

  return (
    <div className="container max-w-5xl py-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage physical locations or branches for {activeBusiness.name}.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {branches.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
              No branches found. Create your first branch to get started.
            </div>
          ) : (
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    {canEdit && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {branches.map((branch) => (
                    <tr key={branch.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{branch.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{branch.address || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${branch.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {branch.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <BranchActions
                            branch={branch}
                            businessId={activeBusiness.id}
                            canEdit={canEdit}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {canCreate && (
          <div>
            <CreateBranchForm businessId={activeBusiness.id} />
          </div>
        )}
      </div>
    </div>
  );
}

