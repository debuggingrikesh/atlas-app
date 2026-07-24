 

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { getUserProfile } from '@/modules/auth/lib/get-user-profile';
import { getBusinessMembers } from '@/modules/team/lib/get-members';
import { getInvitations } from '@/modules/invitations/lib/get-invitations';
import { TeamMemberList } from '@/modules/team/components/TeamMemberList';
import { PendingInvitationsList } from '@/modules/team/components/PendingInvitationsList';
import { InviteMemberModal } from '@/modules/team/components/InviteMemberModal';
import { getActiveBusiness } from '@/lib/auth/get-active-business';
import { resolvePermissions } from '@/lib/permissions/resolve-permissions';
import { PERMISSIONS } from '@atlas/core';

export const metadata: Metadata = {
  title: 'Team Settings — Atlas',
  description: 'Manage your team members and roles.',
};

export default async function TeamSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const profile = await getUserProfile(user.id);
  // Dashboard layout already guarantees profile and memberships exist.
  const activeBusiness = (await getActiveBusiness(profile!.businesses))!;
  
  const perms = resolvePermissions(activeBusiness);
  if (!perms.hasPermission(PERMISSIONS.member.read)) {
    redirect(`/dashboard/${activeBusiness.slug}`);
  }

  const businessId = activeBusiness.id;

  // Fetch team members
  const members = await getBusinessMembers(businessId);

  // Fetch pending invitations
  const pendingInvitations = await getInvitations(businessId);

  // Fetch available roles for the dropdown (exclude OWNER — can't be assigned via UI)
  const availableRoles = await prisma.role.findMany({
    where: { businessId },
    orderBy: { name: 'asc' },
  });

  // No longer tracking currentUserRole as it is not needed by TeamMemberList

  return (
    <div className="container max-w-5xl py-10 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage members, roles, and pending invitations for {activeBusiness.name}.
          </p>
        </div>
        {perms.hasPermission(PERMISSIONS.member.invite) && (
          <InviteMemberModal businessId={businessId} availableRoles={availableRoles} />
        )}
      </div>

      <TeamMemberList
        members={members}
        businessId={businessId}
        currentUserId={user.id}
        availableRoles={availableRoles}
        canManageRoles={perms.hasPermission(PERMISSIONS.role.manage)}
        canRemoveMembers={perms.hasPermission(PERMISSIONS.member.remove)}
      />

      <PendingInvitationsList 
        invitations={pendingInvitations} 
        businessId={businessId} 
        canManageInvitations={perms.hasPermission(PERMISSIONS.member.invite)}
      />
    </div>
  );
}

