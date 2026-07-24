'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  User,
  Phone,
  Mail,
  Store,
  Megaphone,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface SerializedRequest {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  openedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  campaign: { id: string; name: string };
  branch: { id: string; name: string } | null;
  feedback: { id: string; status: string; rating: number; comment: string | null } | null;
}

interface Props {
  request: SerializedRequest;
  businessId: string;
  businessSlug: string;
  availableActions: { canCancel: boolean; canExpire: boolean; };
  displayStatus: string;
}

export function ReviewRequestDetail({ request, businessId, businessSlug, availableActions, displayStatus }: Props) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const expiresDate = request.expiresAt ? new Date(request.expiresAt) : new Date(new Date(request.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000);

  const handleAction = async (action: 'cancel' | 'expire') => {
    if (action === 'cancel' && !window.confirm('Are you sure you want to cancel this review request?')) return;
    if (action === 'expire' && !window.confirm('Are you sure you want to manually expire this review request?')) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/reputation/requests/${request.id}?businessId=${businessId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error?.message || `Failed to ${action} request`);
      }
      toast.success(`Request ${action === 'cancel' ? 'cancelled' : 'expired'} successfully`);
      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || `Failed to ${action} request`);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: 'secondary',
    OPENED: 'secondary',
    COMPLETED: 'default',
    EXPIRED: 'destructive',
    CANCELLED: 'destructive',
  };

  const timelineEvents = [
    { label: 'Created & Sent', date: request.createdAt, icon: Megaphone, active: true },
    { label: 'Opened', date: request.openedAt, icon: ExternalLink, active: !!request.openedAt },
    { label: 'Completed', date: request.completedAt, icon: CheckCircle, active: !!request.completedAt },
  ];

  if (displayStatus === 'EXPIRED') {
    timelineEvents.push({ label: 'Expired', date: request.expiresAt || expiresDate.toISOString(), icon: Clock, active: true });
  } else if (displayStatus === 'CANCELLED') {
    timelineEvents.push({ label: 'Cancelled', date: request.updatedAt, icon: XCircle, active: true });
  }

  return (
    <div className="container p-6 space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Review Request Detail</h2>
          <p className="text-sm text-muted-foreground font-mono mt-1">ID: {request.id}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={statusColors[displayStatus] as 'default' | 'secondary' | 'destructive'} className="text-sm px-3 py-1">
            {displayStatus}
          </Badge>
          
          {(availableActions.canCancel || availableActions.canExpire) && (
            <div className="flex gap-2 ml-4">
              {availableActions.canCancel && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleAction('cancel')}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
              )}
              {availableActions.canExpire && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleAction('expire')}
                  disabled={isUpdating}
                >
                  Expire
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Customer Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{request.customerName || 'Anonymous'}</span>
            </div>
            {request.customerEmail && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{request.customerEmail}</span>
              </div>
            )}
            {request.customerPhone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{request.customerPhone}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Source Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <span>Campaign: <span className="font-medium">{request.campaign.name}</span></span>
            </div>
            {request.branch && (
              <div className="flex items-center gap-3 text-sm">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span>Branch: <span className="font-medium">{request.branch.name}</span></span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <span>Channel: <span className="font-medium">{request.source}</span></span>
            </div>
            {(displayStatus === 'PENDING' || displayStatus === 'OPENED') && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground pt-2 border-t mt-2">
                <Clock className="h-4 w-4" />
                <span>Expires on {expiresDate.toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-lg border-b pb-2 mb-6">Lifecycle Timeline</h3>
        <div className="space-y-6">
          {timelineEvents.map((event, idx) => (
            <div key={event.label} className={`flex gap-4 ${!event.active ? 'opacity-40' : ''}`}>
              <div className="flex flex-col items-center">
                <div className={`p-2 rounded-full ${event.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <event.icon className="h-5 w-5" />
                </div>
                {idx < timelineEvents.length - 1 && (
                  <div className={`w-0.5 h-full my-2 ${event.active && timelineEvents[idx+1].active ? 'bg-primary/20' : 'bg-muted'}`} />
                )}
              </div>
              <div className="pb-6">
                <p className="font-medium">{event.label}</p>
                <p className="text-sm text-muted-foreground">
                  {event.active && event.date ? new Date(event.date).toLocaleString() : 'Pending'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {request.feedback && (
        <Card className="p-6 space-y-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Associated Feedback</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Rating: {request.feedback.rating}/5</Badge>
              <Badge variant="secondary">{request.feedback.status}</Badge>
            </div>
            {request.feedback.comment ? (
              <p className="text-sm mt-2 italic">&ldquo;{request.feedback.comment}&rdquo;</p>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">No comment provided.</p>
            )}
            <div className="pt-2">
              <a 
                href={`/dashboard/${businessSlug}/reputation/feedback/${request.feedback.id}`}
                className="text-sm text-primary hover:underline"
              >
                View full feedback &rarr;
              </a>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
