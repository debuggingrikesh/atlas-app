import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { PERMISSIONS } from '@atlas/core';
import { resolvePermissions } from '@/lib/permissions/resolve-permissions';
import { ReviewLifecycleService } from '@/modules/reputation/services/review-lifecycle-service';
import { ReviewRequestDetail } from '@/modules/reputation/components/dashboard/ReviewRequestDetail';

interface PageProps {
  params: Promise<{ businessSlug: string; id: string }>;
}

export default async function ReviewRequestDetailPage({ params }: PageProps) {
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

  const perms = resolvePermissions({
    ...membership.business,
    role: membership.role,
    rbacRole: membership.rbacRole,
  });

  if (!perms.hasPermission(PERMISSIONS.reputation.view)) {
    notFound();
  }

  const canManage = perms.hasPermission(PERMISSIONS.reputation.manage);

  const request = await prisma.reviewRequest.findUnique({
    where: { id, businessId: membership.businessId },
    include: {
      campaign: true,
      branch: true,
      feedback: true,
    }
  });

  if (!request) notFound();

  // Next.js boundary serialization
  const expiresDate = request.expiresAt || new Date(request.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  const isExpired = request.status === 'EXPIRED' || (new Date() > expiresDate && request.status === 'PENDING');
  const displayStatus = isExpired ? 'EXPIRED' : request.status;

  const availableActions = {
    canCancel: canManage && ReviewLifecycleService.canTransition('ReviewRequest', displayStatus, 'CANCELLED'),
    canExpire: canManage && ReviewLifecycleService.canTransition('ReviewRequest', displayStatus, 'EXPIRED'),
  };

  const serializedRequest = {
    ...request,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    openedAt: request.openedAt?.toISOString() || null,
    completedAt: request.completedAt?.toISOString() || null,
    expiresAt: request.expiresAt?.toISOString() || null,
    campaign: {
      id: request.campaign.id,
      name: request.campaign.name,
    },
    branch: request.branch ? {
      id: request.branch.id,
      name: request.branch.name,
    } : null,
    feedback: request.feedback ? {
      id: request.feedback.id,
      status: request.feedback.status,
      rating: request.feedback.rating,
      comment: request.feedback.comment,
    } : null
  };

  return (
    <ReviewRequestDetail 
      request={serializedRequest} 
      businessId={membership.businessId} 
      businessSlug={businessSlug}
      availableActions={availableActions}
      displayStatus={displayStatus}
    />
  );
}
