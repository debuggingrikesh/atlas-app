import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { resolvePermissions } from '@/lib/permissions/resolve-permissions';
import { PERMISSIONS } from '@atlas/core';
import { ReputationRepository } from '@/modules/reputation/repositories/reputation-repository';
import { CampaignDashboard } from '@/modules/reputation/components/campaign/CampaignDashboard';

interface PageProps {
  params: Promise<{ businessSlug: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id, businessSlug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const membership = await prisma.businessMember.findFirst({
    where: {
      userId: user.id,
      business: { slug: businessSlug, deletedAt: null },
    },
    select: { businessId: true },
  });
  if (!membership) return {};

  const campaign = await ReputationRepository.getCampaignById(id, membership.businessId);
  return {
    title: campaign ? `${campaign.name} – Campaign Dashboard` : 'Campaign Dashboard',
  };
}

/**
 * Server page for a single Campaign Dashboard.
 * Validates access, fetches the campaign record, then delegates rendering
 * to the CampaignDashboard client component (which fetches metrics).
 */
export default async function CampaignDashboardPage({ params }: PageProps) {
  const { businessSlug, id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const membership = await prisma.businessMember.findFirst({
    where: {
      userId: user.id,
      business: { slug: businessSlug, deletedAt: null },
    },
    include: {
      business: true,
      rbacRole: {
        include: {
          permissions: { include: { permission: true } },
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

  // Require at minimum reputation.view
  if (!perms.hasPermission(PERMISSIONS.reputation.view)) {
    notFound();
  }

  const canManage = perms.hasPermission(PERMISSIONS.reputation.manage);

  const campaign = await ReputationRepository.getCampaignById(id, businessId);
  if (!campaign || campaign.archivedAt) notFound();

  // Serialize dates (Next.js Server → Client boundary)
  const serializedCampaign = {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
    branch: null as { name: string } | null,
  };

  // Fetch branch name if campaign has a branchId
  if (campaign.branchId) {
    const branch = await prisma.branch.findUnique({
      where: { id: campaign.branchId },
      select: { name: true },
    });
    serializedCampaign.branch = branch;
  }

  return (
    <CampaignDashboard
      campaign={serializedCampaign}
      businessId={businessId}
      businessSlug={businessSlug}
      canManage={canManage}
    />
  );
}
