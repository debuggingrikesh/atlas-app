 

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/modules/auth/lib/get-user-profile';
import { getActiveBusiness } from '@/lib/auth/get-active-business';
import Link from 'next/link';

export default async function RootPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const profile = await getUserProfile(user.id);

    if (!profile) {
      const supabaseClient = await createClient();
      await supabaseClient.auth.signOut();
      redirect('/auth/login');
    }

    const hasMembership =
      profile.businesses && profile.businesses.length > 0;

    if (hasMembership) {
      const activeBusiness = await getActiveBusiness(profile.businesses);

      if (activeBusiness) {
        redirect(`/dashboard/${activeBusiness.slug}`);
      }
    }

    redirect('/onboarding/step/1');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Atlas
          </h1>
          <p className="font-medium text-foreground">
            Business Operations Platform
          </p>
        </div>

        <p className="text-muted-foreground">
          Manage your business, reputation, AI tools, customers, and workflows.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/auth/login"
            className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Sign In
          </Link>

          <Link
            href="/auth/signup"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}