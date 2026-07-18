import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/modules/auth/lib/get-user-profile';
import { BusinessProvider } from '@/modules/business/components/BusinessProvider';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth verification (defence in depth — proxy also checks this)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // MVP: Bypass email verification check

  const profile = await getUserProfile(user.id);
  
  if (!profile) {
    await supabase.auth.signOut();
    redirect('/login');
  }

  const hasMembership = profile.businesses.length > 0;

  if (!hasMembership) {
    redirect('/onboarding/step/1');
  }

  return (
    <BusinessProvider initialBusinesses={profile.businesses}>
      <div className="grid min-h-screen w-full md:grid-cols-[256px_1fr]">
        <Sidebar />
        <div className="flex flex-col">
          <TopNav userFullName={profile.fullName ?? ''} userEmail={user.email ?? ''} />
          <main className="flex-1 flex flex-col">{children}</main>
        </div>
      </div>
    </BusinessProvider>
  );
}
