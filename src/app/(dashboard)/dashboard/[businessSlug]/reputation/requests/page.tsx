 

import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { ReputationRepository } from '@/modules/reputation/repositories/reputation-repository';
import { ReviewRequestTable } from '@/modules/reputation/components/dashboard/ReviewRequestTable';

interface PageProps {
  params: Promise<{ businessSlug: string }>;
}

export default async function ReviewRequestsPage({ params }: PageProps) {
  const { businessSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  // Fetch business member
  const membership = await prisma.businessMember.findFirst({
    where: {
      userId: user.id,
      business: { slug: businessSlug },
    },
  });

  if (!membership) notFound();

  const businessId = membership.businessId;

  // Fetch review requests
  const requests = await ReputationRepository.getReviewRequests(businessId);

  // Map dates to strings for safe client serialization
  const serializedRequests = requests.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div className="container p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Review Requests Log</h2>
        <p className="text-sm text-muted-foreground">
          Track and filter individual review invitations sent to your customers.
        </p>
      </div>

      <ReviewRequestTable initialRequests={serializedRequests} />
    </div>
  );
}
