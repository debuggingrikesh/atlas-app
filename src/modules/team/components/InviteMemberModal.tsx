'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
}

export function InviteMemberModal({
  businessId,
  availableRoles,
}: {
  businessId: string;
  availableRoles: Role[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  // Default to the first non-OWNER role available
  const initialRole = availableRoles.find((r) => r.name !== 'OWNER')?.id || '';
  const [roleId, setRoleId] = useState(initialRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !roleId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/business/${businessId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, roleId }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Invitation sent! Raw token (for MVP dev testing): ${data.data.rawToken}`);
        setIsOpen(false);
        window.location.reload();
      } else {
        toast.error(data.error?.message || 'Failed to send invitation');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        Invite Member
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Invite a Team Member</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Assign a Role</Label>
            <select
              id="role"
              required
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {availableRoles.map((role) => (
                <option key={role.id} value={role.id} disabled={role.name === 'OWNER'}>
                  {role.name} {role.name === 'OWNER' ? '(Restricted)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Invite'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
