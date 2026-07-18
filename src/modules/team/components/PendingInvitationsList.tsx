'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PendingInvitation {
  id: string;
  email: string;
  role: { name: string };
  expiresAt: string | Date;
}

export function PendingInvitationsList({
  invitations,
  businessId,
  canManageInvitations,
}: {
  invitations: PendingInvitation[];
  businessId: string;
  canManageInvitations: boolean;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (id: string, action: 'cancel' | 'resend') => {
    if (action === 'cancel' && !confirm('Are you sure you want to cancel this invitation?')) return;
    
    setLoading(`${action}-${id}`);
    try {
      const endpoint = action === 'cancel' 
        ? `/api/invitations/${id}` 
        : `/api/business/${businessId}/invitations/${id}/resend`;
      
      const res = await fetch(endpoint, {
        method: action === 'cancel' ? 'DELETE' : 'POST',
      });
      
      if (res.ok) {
        if (action === 'resend') {
          toast.success('Invitation resent successfully.');
        } else {
          toast.success('Invitation cancelled.');
        }
        window.location.reload();
      } else {
        const error = await res.json();
        toast.error(error.error?.message || `Failed to ${action} invitation`);
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  if (invitations.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium text-foreground mb-4">Pending Invitations</h3>
      <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Expires</th>
                {canManageInvitations && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {invitations.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-foreground">{inv.email}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-secondary text-secondary-foreground">
                      {inv.role.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-muted-foreground">
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </span>
                  </td>
                  {canManageInvitations && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loading !== null}
                        onClick={() => handleAction(inv.id, 'resend')}
                      >
                        {loading === `resend-${inv.id}` && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        {loading === `resend-${inv.id}` ? 'Resending...' : 'Resend'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={loading !== null}
                        onClick={() => handleAction(inv.id, 'cancel')}
                      >
                        {loading === `cancel-${inv.id}` && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        {loading === `cancel-${inv.id}` ? 'Cancelling...' : 'Cancel'}
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
