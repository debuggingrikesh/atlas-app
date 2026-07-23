 

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/modules/auth/lib/get-user-profile';
import { ProfileForm } from '@/modules/auth/components/ProfileForm';
import { getActiveBusiness } from '@/lib/auth/get-active-business';

export const metadata: Metadata = {
  title: 'Profile Settings — Atlas',
  description: 'Update your display name and avatar.',
};

/**
 * /settings/profile
 *
 * Server Component — fetches the current profile on the server, then passes
 * initial values to the controlled ProfileForm client component.
 * The dashboard layout already guards this route (auth + onboarding check).
 */
export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const profile = await getUserProfile(user.id);

  const activeBusiness = await getActiveBusiness(profile!.businesses);
  const membership = profile!.businesses.find(b => b.id === activeBusiness?.id);
  const roleName = membership?.rbacRole?.name || membership?.role || 'Member';
  const businessName = activeBusiness?.name || 'Unknown Business';

  return (
    <div className="container max-w-lg py-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Profile settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your display name and avatar URL.
        </p>
      </div>

      <ProfileForm
        initialFullName={profile!.fullName}
        initialAvatarUrl={profile!.avatarUrl}
        email={profile!.email}
        businessName={businessName}
        roleName={roleName}
      />
    </div>
  );
}
