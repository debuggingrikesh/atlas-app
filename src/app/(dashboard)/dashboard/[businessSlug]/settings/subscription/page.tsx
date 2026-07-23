/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useBusiness } from '@/modules/business/components/BusinessProvider';
import { PlanComparisonTable } from '@/modules/billing/components/PlanComparisonTable';

export default function SubscriptionSettingsPage() {
  const { currentBusiness } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [note, setNote] = useState('');
  const [submittingUpgrade, setSubmittingUpgrade] = useState(false);
  const [upgradeSubmitted, setUpgradeSubmitted] = useState(false);

  const fetchSubscriptionDetails = async () => {
    if (!currentBusiness) return;
    try {
      const res = await fetch(`/api/subscription/current?businessId=${currentBusiness.id}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch subscription details');
      }
      setData(json.data);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentBusiness) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetchSubscriptionDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBusiness]);

  const handleUpgradeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    setSubmittingUpgrade(true);
    setError(null);

    try {
      const res = await fetch('/api/subscription/upgrade-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: currentBusiness.id,
          note
        })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to request upgrade');
      }
      setUpgradeSubmitted(true);
      setIsModalOpen(false);
      // Refresh state
      await fetchSubscriptionDetails();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSubmittingUpgrade(false);
    }
  };

  if (loading) {
    return <div className="container max-w-5xl py-10 px-4">Loading subscription details...</div>;
  }

  const subscription = data?.subscription;
  const usage = data?.usage?.reviewRequests;
  const pendingRequest = data?.pendingUpgradeRequest;

  // Determine current active plan
  const planName = subscription?.plan?.name || 'Free Plan';
  const planCode = subscription?.plan?.code || 'FREE';
  const subStatus = subscription?.status || 'ACTIVE';
  const startedAt = subscription?.startedAt ? new Date(subscription.startedAt).toLocaleDateString() : 'N/A';
  const expiresAt = subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'Never';

  // Check if owner
  const isOwner = currentBusiness?.role === 'OWNER';

  return (
    <div className="container max-w-5xl py-10 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscription Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your business plans, feature access, and usage limits.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/15 text-destructive text-sm rounded-xl border border-destructive/20">
          {error}
        </div>
      )}

      {upgradeSubmitted && (
        <div className="p-4 bg-emerald-500/15 text-emerald-700 text-sm rounded-xl border border-emerald-500/20">
          Upgrade request submitted successfully. Atlas will contact you shortly.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your current subscription tier details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Plan</span>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">
                {planName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <span className="text-sm font-semibold capitalize text-emerald-600">{subStatus.toLowerCase()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Started On</span>
              <span className="text-sm font-semibold">{startedAt}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Expires On</span>
              <span className="text-sm font-semibold">{expiresAt}</span>
            </div>
          </CardContent>
        </Card>

        {/* Feature Usage Card */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Usage</CardTitle>
            <CardDescription>Overview of your current limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">Review Requests</span>
                <span className="font-semibold">
                  {usage?.count ?? 0} / {usage?.limit === -1 ? 'Unlimited' : (usage?.limit ?? 6)}
                </span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ 
                    width: usage?.limit === -1 ? '100%' : `${Math.min(100, ((usage?.count ?? 0) / (usage?.limit ?? 6)) * 100)}%` 
                  }}
                />
              </div>
            </div>

            <div className="pt-2">
              {planCode === 'FREE' ? (
                pendingRequest ? (
                  <div className="p-3 bg-amber-500/10 text-amber-800 text-xs rounded-lg border border-amber-500/20">
                    Upgrade request to **Pro Plan** is pending review.
                  </div>
                ) : isOwner ? (
                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                      Upgrade to Pro
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={handleUpgradeRequest}>
                        <DialogHeader>
                          <DialogTitle>Confirm Upgrade Request</DialogTitle>
                          <DialogDescription>
                            Submit a request to upgrade your account to the Pro Plan. We will contact you shortly to finalize configuration.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="note">Add an optional note (e.g. branch count, specific needs)</Label>
                            <Input
                              id="note"
                              placeholder="Please upgrade my organization..."
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsModalOpen(false)}
                            disabled={submittingUpgrade}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={submittingUpgrade}>
                            {submittingUpgrade ? 'Submitting...' : 'Submit Request'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">
                    Only organization Owners can request upgrades.
                  </p>
                )
              ) : (
                <div className="p-3 bg-emerald-500/10 text-emerald-800 text-xs text-center rounded-lg border border-emerald-500/20 font-medium">
                  You are already enjoying all premium Pro features!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Features comparison */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Feature Comparison</h2>
        <PlanComparisonTable />
      </div>
    </div>
  );
}
