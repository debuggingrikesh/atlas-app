/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { resolvePermissions } from '@/lib/permissions/resolve-permissions';
import { PERMISSIONS } from '@atlas/core/auth';
import { ReputationTabs } from '@/modules/reputation/components/dashboard/ReputationTabs';

interface Props {
  children: React.ReactNode;
  params: Promise<{ businessSlug: string }>;
}

export default async function ReputationLayout({ children, params }: Props) {
  const { businessSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch business member to verify and resolve permissions
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

  if (!membership) {
    notFound();
  }

  const perms = resolvePermissions({
    ...membership.business,
    role: membership.role,
    rbacRole: membership.rbacRole,
  });

  // Guard: reputation.view is required
  if (!perms.hasPermission(PERMISSIONS.reputation.view)) {
    redirect(`/dashboard/${businessSlug}`);
  }

  const hasFeedbackView = perms.hasPermission(PERMISSIONS.reputation.feedbackView);

  return (
    <div className="flex flex-col flex-1">
      <ReputationTabs 
        businessSlug={businessSlug} 
        hasFeedbackViewPermission={hasFeedbackView} 
      />
      <div className="flex-1 bg-muted/20">
        {children}
      </div>
    </div>
  );
}
