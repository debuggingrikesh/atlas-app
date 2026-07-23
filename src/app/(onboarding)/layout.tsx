/* eslint-disable @typescript-eslint/no-explicit-any */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // These should already be caught by proxy, but defence in depth:
  if (!user) redirect('/auth/login');
  // MVP: Bypass email verification check

  // If the user has already completed onboarding, redirect to their dashboard
  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: {
      onboardingCompletedAt: true,
      memberships: {
        select: { business: { select: { slug: true } } },
        take: 1,
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (profile) {
    const hasMembership = profile.memberships && profile.memberships.length > 0;
    
    if (profile.onboardingCompletedAt || hasMembership) {
      const slug = profile.memberships[0]?.business?.slug;
      redirect(slug ? `/dashboard/${slug}` : '/');
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Atlas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Let&apos;s set up your business</p>
      </div>
      {children}
    </div>
  );
}
