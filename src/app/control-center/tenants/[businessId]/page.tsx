import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { requirePlatformRole } from '@/lib/auth/require-auth';
import { SubscriptionActions } from './SubscriptionActions';

export default async function TenantControlCenterPage({
  params
}: {
  params: Promise<{ businessId: string }>
}) {
  const { userProfile } = await requirePlatformRole(['SUPER_ADMIN', 'FINANCE', 'SUPPORT', 'ANALYST']);
  if (!userProfile) return null;

  const { businessId } = await params;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      subscription: {
        include: {
          plan: {
            include: { features: true }
          }
        }
      }
    }
  });

  if (!business) {
    notFound();
  }

  const sub = business.subscription;
  const plan = sub?.plan;
  const isSuperAdmin = userProfile.platformRole === 'SUPER_ADMIN';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{business.name}</h1>
        <p className="text-muted-foreground">Tenant Internal Diagnostics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Billing status and active plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Plan:</span>
              <span>{plan ? plan.name : 'No Active Plan (Assumed Free)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span>{sub ? sub.status : 'N/A'}</span>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2 text-sm">Entitlements</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {plan?.features.map(f => (
                  <li key={f.id} className="flex justify-between">
                    <span>{f.featureKey}</span>
                    <span>{f.enabled ? 'Enabled' : 'Disabled'} ({f.limit > 0 ? f.limit : 'Unlimited'})</span>
                  </li>
                ))}
                {!plan?.features?.length && <li>No entitlements available.</li>}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual Plan Override</CardTitle>
            <CardDescription>Force subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            {isSuperAdmin ? (
              <SubscriptionActions businessId={businessId} currentPlanCode={plan?.code} />
            ) : (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
                Only SUPER_ADMIN can modify subscription tiers.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
