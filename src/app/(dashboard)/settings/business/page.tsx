import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { getUserProfile } from '@/modules/auth/lib/get-user-profile';
import { getActiveBusiness } from '@/lib/auth/get-active-business';
import { resolvePermissions } from '@/lib/permissions/resolve-permissions';
import { PERMISSIONS } from '@/lib/permissions/permissions';
import { UpdateBusinessForm } from './UpdateBusinessForm';

export const metadata: Metadata = {
  title: 'Business Settings — Atlas',
  description: 'Manage your business details and preferences.',
};

export default async function BusinessSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const profile = await getUserProfile(user.id);
  const activeBusiness = (await getActiveBusiness(profile!.businesses))!;
  
  const perms = resolvePermissions(activeBusiness);
  if (!perms.hasPermission(PERMISSIONS.business.read)) {
    redirect(`/dashboard/${activeBusiness.slug}`);
  }
  
  const business = (await prisma.business.findUnique({
    where: { id: activeBusiness.id },
    include: { industryTemplate: true },
  }))!;

  return (
    <div className="container max-w-5xl py-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Business Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your business profile, name, and configuration.
        </p>
      </div>

      <div className="max-w-2xl">
        <UpdateBusinessForm business={business} />
      </div>
    </div>
  );
}
