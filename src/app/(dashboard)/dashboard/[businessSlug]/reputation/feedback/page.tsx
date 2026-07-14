import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { resolvePermissions } from '@/lib/permissions/resolve-permissions';
import { PERMISSIONS } from '@/lib/permissions/permissions';
import { ReputationRepository } from '@/modules/reputation/repositories/reputation-repository';
import { FeedbackInbox } from '@/modules/reputation/components/dashboard/FeedbackInbox';

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
      business: { slug: businessSlug },
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

  // Fetch private customer feedback
  const feedbackResult = await ReputationRepository.getFeedback(businessId, 1, 50);

  // Map dates to strings for safe client serialization
  const serializedFeedback = feedbackResult.data.map(f => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
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
        canManage={canManage}
        canGenerateAIResponse={perms.hasPermission(PERMISSIONS.reputation.aiResponseGenerate)}
      />
    </div>
  );
}
