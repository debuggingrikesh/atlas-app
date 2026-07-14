'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminSubscriptionsPage() {
  const [adminSecret, setAdminSecret] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('atlas_admin_secret') || '';
    }
    return '';
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  const loadRequests = async (secretToUse = adminSecret) => {
    if (!secretToUse) {
      setError('Please provide an Admin Secret Key.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/admin/subscription/upgrade-requests', {
        headers: {
          'Authorization': `Bearer ${secretToUse}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch upgrade requests');
      }
      setRequests(data.data.requests);
      localStorage.setItem('atlas_admin_secret', secretToUse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    setActioning(requestId);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/subscription/upgrade-requests/${requestId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminSecret}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action.toLowerCase()} request`);
      }
      setSuccess(`Request successfully ${action.toLowerCase()}d.`);
      await loadRequests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="container max-w-5xl py-10 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Atlas Administration Panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Internal operations and subscription upgrade request approvals.
        </p>
      </div>

      {/* Admin Auth Card */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Credentials</CardTitle>
          <CardDescription>Enter the system ADMIN_SECRET to manage subscriptions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4 max-w-md">
            <div className="flex-1 space-y-2">
              <Label htmlFor="secret">Admin Secret Key</Label>
              <Input
                id="secret"
                type="password"
                placeholder="Enter ADMIN_SECRET"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
              />
            </div>
            <Button onClick={() => loadRequests()} disabled={loading}>
              Connect
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-destructive/15 text-destructive text-sm rounded-xl border border-destructive/20">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/15 text-emerald-700 text-sm rounded-xl border border-emerald-500/20">
          {success}
        </div>
      )}

      {/* Upgrade Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Upgrade Requests</CardTitle>
          <CardDescription>Manage user-submitted business upgrade requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-xl bg-card">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-6 text-left align-middle font-semibold text-muted-foreground">Business</th>
                  <th className="h-12 px-6 text-left align-middle font-semibold text-muted-foreground">Current Plan</th>
                  <th className="h-12 px-6 text-left align-middle font-semibold text-muted-foreground">Requested Plan</th>
                  <th className="h-12 px-6 text-left align-middle font-semibold text-muted-foreground">Request Date</th>
                  <th className="h-12 px-6 text-left align-middle font-semibold text-muted-foreground">Note</th>
                  <th className="h-12 px-6 text-center align-middle font-semibold text-muted-foreground">Status</th>
                  <th className="h-12 px-6 text-right align-middle font-semibold text-muted-foreground w-[200px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">Loading requests...</td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">No upgrade requests found. Connect with valid credentials to load data.</td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/30">
                      <td className="p-6 align-middle font-medium">{req.business?.name}</td>
                      <td className="p-6 align-middle font-semibold capitalize text-muted-foreground">
                        {req.business?.subscription?.plan?.name || 'Free Plan'}
                      </td>
                      <td className="p-6 align-middle font-semibold text-primary">{req.requestedPlan?.name}</td>
                      <td className="p-6 align-middle text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-6 align-middle text-muted-foreground max-w-xs truncate" title={req.note}>
                        {req.note || '-'}
                      </td>
                      <td className="p-6 align-middle text-center">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${
                          req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-800 ring-amber-500/20' :
                          req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-800 ring-emerald-500/20' :
                          'bg-destructive/10 text-destructive ring-destructive/20'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-6 align-middle text-right space-x-2">
                        {req.status === 'PENDING' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleAction(req.id, 'REJECT')}
                              disabled={actioning !== null}
                            >
                              Reject
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleAction(req.id, 'APPROVE')}
                              disabled={actioning !== null}
                            >
                              Approve
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
