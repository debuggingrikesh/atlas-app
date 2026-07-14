import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/modules/auth/lib/get-user-profile';
import { getActiveBusiness } from '@/lib/auth/get-active-business';
import Link from 'next/link';

/**
 * Root route — renders a landing page for unauthenticated users.
 * Authenticated users are redirected to their active dashboard.
 */
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const profile = await getUserProfile(user.id);

    if (!profile) {
      const supabaseClient = await createClient(); // re-create client to sign out
      await supabaseClient.auth.signOut();
      redirect('/login');
    }

    const hasMembership = profile.businesses && profile.businesses.length > 0;
    
    // 1. FIRST: Check if user has memberships
    if (hasMembership) {
      const activeBusiness = await getActiveBusiness(profile.businesses);
      if (activeBusiness) {
        redirect(`/dashboard/${activeBusiness.slug}`);
      }
    }
    
    // 2. ONLY if no memberships, redirect to onboarding
    redirect('/onboarding/step/1');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b bg-background px-6 lg:px-8">
        <div className="flex items-center gap-2 font-bold tracking-tight text-lg">
          Project Atlas
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline underline-offset-4">
            Login
          </Link>
          <Link href="/signup" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            Create Account
          </Link>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-[800px] space-y-6">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl text-foreground">
            Business management platform
          </h1>
          <p className="mx-auto max-w-[600px] text-lg text-muted-foreground">
            Manage your branches, team members, and roles seamlessly with Project Atlas. Experience a professional SaaS architecture designed for scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/signup" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              Get Started
            </Link>
            <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              Sign In
            </Link>
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} Project Atlas. All rights reserved.
      </footer>
    </div>
  );
}
