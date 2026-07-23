/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading/LoadingButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ASSIGNABLE_PERMISSIONS } from '@atlas/core/auth';
import { Pencil } from 'lucide-react';

interface RoleEditorModalProps {
  businessId: string;
  role?: {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    permissions: { permission: { key: string } }[];
  };
}

export function RoleEditorModal({ businessId, role }: RoleEditorModalProps) {
  const router = useRouter();
  const isEdit = !!role;
  const isOwner = role?.name === 'OWNER';

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    role?.permissions?.map(rp => rp.permission.key) || []
  );
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (perm: string) => {
    if (isOwner) return; // OWNER permissions cannot be changed
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const url = isEdit
        ? `/api/business/${businessId}/roles/${role.id}`
        : `/api/business/${businessId}/roles`;
      
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, permissions: selectedPermissions }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to save role');
      }

      setOpen(false);
      // Optional: reset state on close if it was a create modal
      if (!isEdit) {
        setName('');
        setDescription('');
        setSelectedPermissions([]);
      }
      
      router.refresh();
    } catch (err: any) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Group permissions logically for the UI
  const groupedPermissions: Record<string, string[]> = {
    Business: ASSIGNABLE_PERMISSIONS.filter((p: string) => p.startsWith('business.')),
    Branches: ASSIGNABLE_PERMISSIONS.filter((p: string) => p.startsWith('branch.')),
    Members: ASSIGNABLE_PERMISSIONS.filter((p: string) => p.startsWith('member.')),
    Roles: ASSIGNABLE_PERMISSIONS.filter((p: string) => p.startsWith('role.')),
    Activity: ASSIGNABLE_PERMISSIONS.filter((p: string) => p.startsWith('activity.')),
    Notifications: ASSIGNABLE_PERMISSIONS.filter((p: string) => p.startsWith('notification.')),
    Profile: ASSIGNABLE_PERMISSIONS.filter((p: string) => p.startsWith('profile.')),
    Settings: ASSIGNABLE_PERMISSIONS.filter((p: string) => p.startsWith('settings.')),
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        isEdit ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" />
        ) : (
          <Button />
        )
      }>
        {isEdit ? <Pencil className="h-4 w-4" /> : 'Create Role'}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? (isOwner ? 'View Role' : 'Edit Role') : 'Create Custom Role'}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? isOwner ? 'Owner permissions are fixed and cannot be modified.' : 'Modify role details and assign specific permissions.'
              : 'Define a new role and assign its specific permissions.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                placeholder="e.g. Branch Manager"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={role?.isSystem || isOwner}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of the role"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isOwner}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Permissions</Label>
            <div className="grid grid-cols-2 gap-6 rounded-md border p-4 bg-muted/10">
              {Object.entries(groupedPermissions).map(([category, perms]) => {
                if (perms.length === 0) return null;
                return (
                  <div key={category} className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground/80 border-b pb-1">{category}</h4>
                    <div className="space-y-2">
                      {perms.map((perm) => (
                        <div key={perm} className="flex items-center space-x-2">
                          <Checkbox
                            id={`perm-${perm}`}
                            checked={selectedPermissions.includes(perm)}
                            onCheckedChange={() => handleToggle(perm)}
                            disabled={isOwner}
                          />
                          <Label
                            htmlFor={`perm-${perm}`}
                            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {perm.split('.').slice(1).join(' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              {isOwner ? 'Close' : 'Cancel'}
            </Button>
            {!isOwner && (
              <LoadingButton type="submit" disabled={!name.trim()} isLoading={isLoading} loadingText="Saving...">
                {isEdit ? 'Save Changes' : 'Create Role'}
              </LoadingButton>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
