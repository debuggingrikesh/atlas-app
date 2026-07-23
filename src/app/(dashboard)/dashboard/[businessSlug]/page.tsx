 

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardReputationSummary } from '@/modules/dashboard/components/DashboardReputationSummary';
import { ProductActivationChecklist } from '@/modules/dashboard/components/ProductActivationChecklist';
import type { BusinessWithMembership } from '@/modules/business/types';

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { businessSlug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: { name: true },
  });
  return {
    title: business ? `${business.name} — Dashboard` : 'Dashboard',
  };
}

export default async function DashboardPage({ params }: Props) {
  const { businessSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  // Verify the business exists and the user is a member
  const membership = await prisma.businessMember.findFirst({
    where: {
      userId: user.id,
      business: { slug: businessSlug },
    },
    include: {
      rbacRole: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      },
      business: {
        include: {
          industryTemplate: { select: { name: true } },
          branches: { where: { isActive: true }, select: { id: true, name: true, address: true } },
        },
      },
    },
  });

  if (!membership) {
    notFound();
  }

  const businessWithMembership: BusinessWithMembership = {
    ...membership.business,
    role: membership.role,
    rbacRole: membership.rbacRole,
  };

  const { business } = membership;

  return (
    <div className="container px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>{business.industryTemplate.name}</span>
          <span>·</span>
          <span className="capitalize">{membership.role.toLowerCase()}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{business.name}</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome to your dashboard.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Branches card */}
        <div className="rounded-lg border bg-card p-6 h-full">
          <p className="text-sm font-medium text-muted-foreground">Active Branches</p>
          <p className="mt-2 text-3xl font-bold">{business.branches.length}</p>
          <div className="mt-3 space-y-1">
            {business.branches.map((b) => (
              <div key={b.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                <span>{b.name}{b.address ? ` — ${b.address}` : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reputation summary card */}
        <Suspense fallback={
          <div className="rounded-lg border bg-card p-6 flex flex-col justify-between col-span-1 lg:col-span-2 h-full opacity-50 animate-pulse">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Reputation Stats</p>
              <div className="mt-4 flex flex-col items-center justify-center text-center py-6 h-[150px]">
                <p className="font-semibold text-foreground">Loading...</p>
              </div>
            </div>
          </div>
        }>
          <DashboardReputationSummary business={businessWithMembership} businessSlug={businessSlug} />
        </Suspense>

        <Suspense fallback={null}>
          <ProductActivationChecklist businessId={business.id} businessSlug={businessSlug} />
        </Suspense>
      </div>
    </div>
  );
}
