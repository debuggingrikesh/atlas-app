/* eslint-disable @typescript-eslint/no-explicit-any */

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
}

interface ReviewRequestTableProps {
  initialRequests: ReviewRequest[];
}

type FilterStatus = 'ALL' | 'PENDING' | 'OPENED' | 'COMPLETED' | 'EXPIRED';

export function ReviewRequestTable({ initialRequests }: ReviewRequestTableProps) {
  const [filter, setFilter] = useState<FilterStatus>('ALL');

  const filteredRequests = useMemo(() => {
    return initialRequests.filter((req) => {
      // Check expiration (30 days from creation)
      const expiresAt = new Date(new Date(req.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000);
      const isExpired = new Date() > expiresAt;

      if (filter === 'ALL') return true;
      if (filter === 'EXPIRED') return isExpired && req.status === 'PENDING';
      
      // If filtering for PENDING, exclude expired ones
      if (filter === 'PENDING') return req.status === 'PENDING' && !isExpired;
      
      return req.status === filter;
    });
  }, [initialRequests, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-semibold text-lg">Review Requests</h3>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'PENDING', 'OPENED', 'COMPLETED', 'EXPIRED'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                filter === status
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted text-muted-foreground border-border'
              }`}
            >
              {status}
            </button>
          ))}
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
                  <th className="p-4 font-semibold">Campaign</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Created Date</th>
                  <th className="p-4 font-semibold">Completed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRequests.map((req) => {
                  const expiresAt = new Date(new Date(req.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000);
                  const isExpired = new Date() > expiresAt && req.status === 'PENDING';
                  const displayStatus = isExpired ? 'EXPIRED' : req.status;

                  return (
                    <tr key={req.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4">
                        <div className="font-medium">{req.customerName || 'Anonymous'}</div>
                        <div className="text-xs text-muted-foreground">
                          {req.customerEmail || req.customerPhone || 'No contact details'}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{req.campaign.name}</td>
                      <td className="p-4">
                        <Badge 
                          variant={
                            displayStatus === 'COMPLETED' 
                              ? 'default' 
                              : displayStatus === 'EXPIRED' 
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
                      <td className="p-4 text-muted-foreground">
                        {req.status === 'COMPLETED'
                          ? new Date(req.updatedAt).toLocaleDateString()
                          : '—'}
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
