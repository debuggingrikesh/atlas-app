'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { LoadingButton } from '@/components/ui/loading/LoadingButton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Play,
  Pause,
  Copy,
  Archive,
  GitBranch,
  CalendarDays,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CampaignHeaderProps {
  campaign: {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    branch: { name: string } | null;
  };
  businessId: string;
  businessSlug: string;
  canManage: boolean;
  onCampaignUpdated: (updated: { status: string }) => void;
}

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  ACTIVE: { label: 'Active', variant: 'default' },
  PAUSED: { label: 'Paused', variant: 'secondary' },
  COMPLETED: { label: 'Completed', variant: 'outline' },
};

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Campaign header displaying name, status badge, metadata, and quick actions.
 */
export function CampaignHeader({
  campaign,
  businessId,
  businessSlug,
  canManage,
  onCampaignUpdated,
}: CampaignHeaderProps) {
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(campaign.status);

  const badgeMeta = STATUS_BADGE[currentStatus] ?? { label: currentStatus, variant: 'secondary' as const };

  const handleToggleStatus = async () => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setIsTogglingStatus(true);
    try {
      const res = await fetch(`/api/reputation/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, status: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setCurrentStatus(nextStatus);
      onCampaignUpdated({ status: nextStatus });
      toast.success(`Campaign ${nextStatus === 'ACTIVE' ? 'resumed' : 'paused'}.`);
    } catch {
      toast.error('Failed to update campaign status.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const res = await fetch(`/api/reputation/campaigns/${campaign.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      if (!res.ok) throw new Error('Failed to duplicate');
      const json = await res.json();
      toast.success('Campaign duplicated successfully.');
      window.location.href = `/dashboard/${businessSlug}/reputation/campaigns/${json.data.campaign.id}`;
    } catch {
      toast.error('Failed to duplicate campaign.');
      setIsDuplicating(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm(`Archive "${campaign.name}"? It will no longer accept new requests.`)) return;
    setIsArchiving(true);
    try {
      const res = await fetch(`/api/reputation/campaigns/${campaign.id}?businessId=${encodeURIComponent(businessId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to archive');
      toast.success('Campaign archived.');
      // Navigate back to list after archive
      window.location.href = `/dashboard/${businessSlug}/reputation/campaigns`;
    } catch {
      toast.error('Failed to archive campaign.');
      setIsArchiving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: name + meta */}
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight truncate">{campaign.name}</h1>
              <Badge variant={badgeMeta.variant} aria-label={`Status: ${badgeMeta.label}`}>
                {badgeMeta.label}
              </Badge>
            </div>

            <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" aria-hidden="true" />
                <dt className="sr-only">Branch</dt>
                <dd>{campaign.branch?.name ?? 'All Branches'}</dd>
              </div>
              <div className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" aria-hidden="true" />
                <dt className="sr-only">Created</dt>
                <dd>Created {formatRelativeDate(campaign.createdAt)}</dd>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                <dt className="sr-only">Last activity</dt>
                <dd>Updated {formatRelativeDate(campaign.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Right: quick actions */}
          {canManage && (
            <div
              className="flex flex-wrap gap-2 shrink-0"
              role="group"
              aria-label="Campaign quick actions"
            >
              <LoadingButton
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
                isLoading={isTogglingStatus}
                loadingText={currentStatus === 'ACTIVE' ? 'Pausing…' : 'Resuming…'}
                aria-label={currentStatus === 'ACTIVE' ? 'Pause campaign' : 'Resume campaign'}
                className={cn(
                  'gap-1.5',
                  currentStatus !== 'ACTIVE' && 'text-green-600 border-green-200 hover:bg-green-50',
                )}
              >
                {currentStatus === 'ACTIVE' ? (
                  <><Pause className="h-3.5 w-3.5" aria-hidden="true" /> Pause</>
                ) : (
                  <><Play className="h-3.5 w-3.5" aria-hidden="true" /> Resume</>
                )}
              </LoadingButton>

              <LoadingButton
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                isLoading={isDuplicating}
                loadingText="Duplicating…"
                aria-label="Duplicate campaign"
                className="gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Duplicate
              </LoadingButton>

              <LoadingButton
                variant="outline"
                size="sm"
                onClick={handleArchive}
                isLoading={isArchiving}
                loadingText="Archiving…"
                aria-label="Archive campaign"
                className="gap-1.5 text-destructive border-destructive/20 hover:bg-destructive/10"
              >
                <Archive className="h-3.5 w-3.5" aria-hidden="true" /> Archive
              </LoadingButton>
            </div>
          )}
        </div>
      </CardHeader>
      {/* Subtle divider */}
      <CardContent className="pt-0 pb-3">
        <div className="border-t border-border/50" />
      </CardContent>
    </Card>
  );
}
