'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

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
          alert('Invitation resent successfully (Check console/server logs for raw token).');
        }
        window.location.reload();
      } else {
        const error = await res.json();
        alert(error.error?.message || `Failed to ${action} invitation`);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  if (invitations.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Invitations</h3>
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
              {canManageInvitations && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invitations.map((inv) => (
              <tr key={inv.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{inv.email}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {inv.role.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">
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
                      {loading === `resend-${inv.id}` ? '...' : 'Resend'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-900 hover:bg-red-50"
                      disabled={loading !== null}
                      onClick={() => handleAction(inv.id, 'cancel')}
                    >
                      {loading === `cancel-${inv.id}` ? '...' : 'Cancel'}
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
