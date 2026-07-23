 

import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { resolvePermissions } from '@/lib/permissions/resolve-permissions';
import { PERMISSIONS } from '@atlas/core/auth';
import { ReputationRepository } from '@/modules/reputation/repositories/reputation-repository';
import { FeedbackInbox } from '@/modules/reputation/components/dashboard/FeedbackInbox';
import { EntitlementService } from '@/modules/billing/services/entitlement-service';

interface PageProps {
  params: Promise<{ businessSlug: string }>;
}

export default async function FeedbackInboxPage({ params }: PageProps) {
  const { businessSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  // Fetch business member with roles and permissions
  const membership = await prisma.businessMember.findFirst({
    where: {
      userId: user.id,
      business: { slug: businessSlug, deletedAt: null },
    },
    include: {
      business: true,
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

  const perms = resolvePermissions({
    ...membership.business,
    role: membership.role,
    rbacRole: membership.rbacRole,
  });
  
  // Guard: reputation.feedbackView is required
  if (!perms.hasPermission(PERMISSIONS.reputation.feedbackView)) {
    redirect(`/dashboard/${businessSlug}/reputation`);
  }

  const businessId = membership.businessId;
  const canManage = perms.hasPermission(PERMISSIONS.reputation.manage);
  const isOwner = membership.role === 'OWNER';
  const isPro = await EntitlementService.canAccessFeature(businessId, 'AI_REPUTATION_ANALYSIS');

  // Fetch private customer feedback
  const feedbackResult = await ReputationRepository.getFeedback(businessId, 1, 50);

  // Map dates to strings for safe client serialization
  const serializedFeedback = feedbackResult.data.map(f => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
    analyses: f.analyses?.map(ai => ({
      id: ai.id,
      analysisData: typeof ai.analysisData === 'object' ? ai.analysisData : JSON.parse(ai.analysisData as string),
      status: ai.status,
      createdAt: ai.createdAt.toISOString()
    })) || [],
  }));

  return (
    <div className="container p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Customer Feedback Inbox</h2>
        <p className="text-sm text-muted-foreground">
          View private ratings and comments submitted by customers. Respond to feedback and track resolutions.
        </p>
      </div>

      <FeedbackInbox
        initialFeedback={serializedFeedback}
        businessId={businessId}
        businessSlug={businessSlug}
        canManage={canManage}
        isOwner={isOwner}
        isPro={isPro}
      />
    </div>
  );
}
