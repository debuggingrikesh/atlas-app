/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
}

interface Member {
  id: string;
  userId: string;
  version: number;
  user: { email: string; fullName: string | null };
  role: string;
  rbacRole: { id: string; name: string } | null;
}

interface TeamMemberListProps {
  members: Member[];
  businessId: string;
  currentUserId: string;
  availableRoles: Role[];
  canManageRoles: boolean;
  canRemoveMembers: boolean;
}

export function TeamMemberList({
  members,
  businessId,
  currentUserId,
  availableRoles,
  canManageRoles,
  canRemoveMembers,
}: TeamMemberListProps) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);
  const [roleChanging, setRoleChanging] = useState<string | null>(null);
  const [roleErrors, setRoleErrors] = useState<Record<string, string>>({});

  const handleRemove = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    setRemoving(memberId);
    try {
      const res = await fetch(`/api/business/${businessId}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Member removed');
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error?.message || 'Failed to remove member');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred');
    } finally {
      setRemoving(null);
    }
  };

  const handleRoleChange = async (member: Member, newRoleId: string) => {
    setRoleChanging(member.id);
    setRoleErrors((prev) => ({ ...prev, [member.id]: '' }));
    try {
      const res = await fetch(`/api/business/${businessId}/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: newRoleId, version: member.version }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to update role.');
      }
      toast.success('Role updated successfully');
      router.refresh();
    } catch (err: any) {
      setRoleErrors((prev) => ({
        ...prev,
        [member.id]: err instanceof Error ? err.message : 'Failed to update role.',
      }));
    } finally {
      setRoleChanging(null);
    }
  };

  // Roles available to assign
  const assignableRoles = availableRoles.filter((r) => {
    return r.name !== 'OWNER'; // OWNER can assign anything except OWNER, non-owners cannot assign OWNER
  });

  return (
    <div className="bg-card border rounded-lg shadow-sm overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
            {canManageRoles && (
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Change Role</th>
            )}
            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {members.map((member) => {
            const roleName = member.rbacRole?.name || member.role;
            const isOwnerMember = roleName === 'OWNER';
            const isSelf = member.userId === currentUserId;
            // Can only change role for: non-owner members, not self
            const canChangeThisRole = canManageRoles && !isOwnerMember && !isSelf;

            return (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{member.user.fullName || 'No name'}</span>
                    <span className="text-sm text-muted-foreground">{member.user.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary">
                    {roleName}
                  </span>
                </td>
                {canManageRoles && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {canChangeThisRole ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <select
                            className="h-8 rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            defaultValue={member.rbacRole?.id ?? ''}
                            onChange={(e) => handleRoleChange(member, e.target.value)}
                            disabled={roleChanging === member.id}
                            aria-label={`Change role for ${member.user.fullName || member.user.email}`}
                          >
                            <option value="" disabled>Select role…</option>
                            {assignableRoles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                          {roleChanging === member.id && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                          )}
                        </div>
                        {roleErrors[member.id] && (
                          <p className="text-xs text-destructive">{roleErrors[member.id]}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={isOwnerMember || isSelf || removing === member.id || !canRemoveMembers}
                    onClick={() => handleRemove(member.id)}
                  >
                    {removing === member.id ? 'Removing...' : 'Remove'}
                  </Button>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
