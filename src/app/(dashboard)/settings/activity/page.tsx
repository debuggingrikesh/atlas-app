import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/modules/auth/lib/get-user-profile';
import { getActivityFeed } from '@/modules/activity/lib/get-activity-feed';
import { ActivityTimeline } from '@/modules/activity/components/ActivityTimeline';

import { getActiveBusiness } from '@/lib/auth/get-active-business';
import { resolvePermissions } from '@/lib/permissions/resolve-permissions';
import { PERMISSIONS } from '@atlas/core/auth';

export const metadata: Metadata = {
  title: 'Activity Timeline — Atlas',
  description: 'View the recent activity for your business.',
};

export default async function ActivitySettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const profile = await getUserProfile(user.id);
  const activeBusiness = (await getActiveBusiness(profile!.businesses))!;
  
  const perms = resolvePermissions(activeBusiness);
  if (!perms.hasPermission(PERMISSIONS.activity.read)) {
    redirect(`/dashboard/${activeBusiness.slug}`);
  }
  
  const businessId = activeBusiness.id;

  // Fetch initial activity data
  const { items, nextCursor } = await getActivityFeed(businessId, { limit: 20 });

  return (
    <div className="container max-w-4xl py-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Activity Timeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recent actions and events within {activeBusiness.name}.
        </p>
      </div>

      <ActivityTimeline
        businessId={businessId}
        initialItems={items}
        initialNextCursor={nextCursor}
      />
    </div>
  );
}
