import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { ReputationRepository } from '@/modules/reputation/repositories/reputation-repository';
import { OverviewCards } from '@/modules/reputation/components/dashboard/OverviewCards';
import { GoogleReviewCard } from '@/modules/reputation/components/dashboard/GoogleReviewCard';
import { UsageMeter } from '@/modules/reputation/components/dashboard/UsageMeter';

interface PageProps {
  params: Promise<{ businessSlug: string }>;
}

export default async function ReputationOverviewPage({ params }: PageProps) {
  const { businessSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  // Fetch business details
  const membership = await prisma.businessMember.findFirst({
    where: {
      userId: user.id,
      business: { slug: businessSlug },
    },
    include: {
      business: true,
    },
  });

  if (!membership) notFound();

  const businessId = membership.businessId;

  // Fetch dashboard stats from Repository
  const stats = await ReputationRepository.getOverviewStats(businessId);

  return (
    <div className="container p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reputation Overview</h2>
        <p className="text-sm text-muted-foreground">
          Monitor your customer reviews, open rates, and general experience ratings.
        </p>
      </div>

      <OverviewCards stats={stats} />

      <div className="grid gap-6 md:grid-cols-2">
        <UsageMeter usage={stats.usage} businessSlug={businessSlug} />
        <GoogleReviewCard />
      </div>
    </div>
  );
}
