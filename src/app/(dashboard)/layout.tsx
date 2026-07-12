import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth verification (defence in depth — middleware also checks this)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // MVP: Bypass email verification check

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { onboardingCompletedAt: true, fullName: true },
  });

  if (!profile?.onboardingCompletedAt) {
    redirect('/onboarding/step/1');
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <span className="font-semibold tracking-tight">Project Atlas</span>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {profile.fullName ?? user.email}
            </span>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
