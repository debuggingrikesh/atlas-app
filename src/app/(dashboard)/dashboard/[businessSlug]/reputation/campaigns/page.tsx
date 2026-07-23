 

import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { resolvePermissions } from '@/lib/permissions/resolve-permissions';
import { PERMISSIONS } from '@atlas/core/auth';
import { ReputationRepository } from '@/modules/reputation/repositories/reputation-repository';
import { CampaignTable } from '@/modules/reputation/components/dashboard/CampaignTable';

interface PageProps {
  params: Promise<{ businessSlug: string }>;
}

export default async function CampaignsPage({ params }: PageProps) {
  const { businessSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  // Fetch business details and active membership
  const membership = await prisma.businessMember.findFirst({
    where: {
      userId: user.id,
      business: { slug: businessSlug },
    },
    include: {
      business: {
        include: {
          branches: {
            where: { isActive: true },
            select: { id: true, name: true }
          }
        }
      },
      rbacRole: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!membership) notFound();

  const businessId = membership.businessId;
  const perms = resolvePermissions({
    ...membership.business,
    role: membership.role,
    rbacRole: membership.rbacRole,
  });
  const canManage = perms.hasPermission(PERMISSIONS.reputation.manage);

  // Fetch campaigns
  const campaigns = await ReputationRepository.getCampaignsWithCounts(businessId);

  // Map campaigns to dates as strings to avoid serialization issues
  const serializedCampaigns = campaigns.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <div className="container p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Review Campaigns</h2>
        <p className="text-sm text-muted-foreground">
          Create and manage your feedback campaigns, define review targets, and toggle settings.
        </p>
      </div>

      <CampaignTable
        initialCampaigns={serializedCampaigns}
        businessId={businessId}
        businessName={membership.business.name}
        branches={membership.business.branches}
        canManage={canManage}
      />
    </div>
  );
}
