 

'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReviewRequest {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  campaign: { name: string };
  branch: { name: string } | null;
  openedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
}

interface ReviewRequestTableProps {
  initialRequests: ReviewRequest[];
}

type FilterStatus = 'ALL' | 'ACTIVE' | 'PENDING' | 'OPENED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

export function ReviewRequestTable({ initialRequests }: ReviewRequestTableProps) {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [campaignFilter, setCampaignFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  const campaigns = useMemo(() => Array.from(new Set(initialRequests.map(r => r.campaign.name))), [initialRequests]);
  const branches = useMemo(() => Array.from(new Set(initialRequests.map(r => r.branch?.name).filter(Boolean))), [initialRequests]);

  const filteredRequests = useMemo(() => {
    return initialRequests.filter((req) => {
      // Check expiration
      const expires = req.expiresAt ? new Date(req.expiresAt) : new Date(new Date(req.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000);
      const isExpired = req.status === 'EXPIRED' || (req.status === 'PENDING' && new Date() > expires);
      const isTerminal = req.status === 'COMPLETED' || req.status === 'CANCELLED' || isExpired;
      const isActive = !isTerminal;

      if (campaignFilter !== 'ALL' && req.campaign.name !== campaignFilter) return false;
      if (branchFilter !== 'ALL' && (req.branch?.name || '') !== branchFilter) return false;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'ACTIVE') return isActive;
      if (statusFilter === 'EXPIRED') return isExpired;
      if (statusFilter === 'CANCELLED') return req.status === 'CANCELLED';
      if (statusFilter === 'PENDING') return req.status === 'PENDING' && !isExpired;
      
      return req.status === statusFilter;
    });
  }, [initialRequests, statusFilter, campaignFilter, branchFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-semibold text-lg">Review Requests</h3>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            {(['ALL', 'ACTIVE', 'PENDING', 'OPENED', 'COMPLETED', 'EXPIRED', 'CANCELLED'] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                  statusFilter === status
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted text-muted-foreground border-border'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <select
            title="Campaign"
            className="px-3 py-1 text-sm border rounded-md bg-background"
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
          >
            <option value="ALL">All Campaigns</option>
            {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {branches.length > 0 && (
            <select
              title="Branch"
              className="px-3 py-1 text-sm border rounded-md bg-background"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="ALL">All Branches</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No review requests found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="p-4 font-semibold">Customer</th>
                  <th className="p-4 font-semibold">Source</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Created</th>
                  <th className="p-4 font-semibold">Latest Activity</th>
                  <th className="p-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRequests.map((req) => {
                  const expires = req.expiresAt ? new Date(req.expiresAt) : new Date(new Date(req.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000);
                  const isExpired = new Date() > expires && req.status === 'PENDING';
                  const displayStatus = isExpired ? 'EXPIRED' : req.status;
                  
                  let latestActivity = new Date(req.createdAt);
                  let activityLabel = 'Created';
                  if (req.completedAt) {
                    latestActivity = new Date(req.completedAt);
                    activityLabel = 'Completed';
                  } else if (req.openedAt) {
                    latestActivity = new Date(req.openedAt);
                    activityLabel = 'Opened';
                  }

                  return (
                    <tr key={req.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4">
                        <div className="font-medium">{req.customerName || 'Anonymous'}</div>
                        <div className="text-xs text-muted-foreground">
                          {req.customerEmail || req.customerPhone || 'No contact details'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{req.campaign.name}</div>
                        {req.branch && <div className="text-xs text-muted-foreground">{req.branch.name}</div>}
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant={
                            displayStatus === 'COMPLETED' 
                              ? 'default' 
                              : displayStatus === 'EXPIRED' || displayStatus === 'CANCELLED'
                              ? 'destructive' 
                              : 'secondary'
                          }
                        >
                          {displayStatus}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        <div>{latestActivity.toLocaleDateString()}</div>
                        <div className="text-xs">{activityLabel}</div>
                      </td>
                      <td className="p-4 text-right">
                        <a href={`requests/${req.id}`} className="text-sm font-medium text-primary hover:underline">
                          View details &rarr;
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
