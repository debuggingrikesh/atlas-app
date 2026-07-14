'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Branch {
  id: string;
  name: string;
  address: string | null;
  isActive: boolean;
}

interface BranchActionsProps {
  branch: Branch;
  businessId: string;
  canEdit: boolean;
}

export function BranchActions({ branch, businessId, canEdit }: BranchActionsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(branch.name);
  const [address, setAddress] = useState(branch.address ?? '');
  const [error, setError] = useState<string | null>(null);

  const patch = async (payload: object) => {
    const res = await fetch(`/api/business/${businessId}/branches/${branch.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Update failed.');
    return data;
  };

  const handleToggle = async () => {
    setToggling(true);
    setError(null);
    try {
      await patch({ isActive: !branch.isActive });
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update.');
    } finally {
      setToggling(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await patch({ name: name.trim(), address: address.trim() || null });
      setEditing(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(branch.name);
    setAddress(branch.address ?? '');
    setEditing(false);
    setError(null);
  };

  if (!canEdit) return null;

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex items-center gap-2">
          <Input
            className="h-7 text-sm w-32"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Branch name"
            aria-label="Branch name"
          />
          <Input
            className="h-7 text-sm w-40"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address (optional)"
            aria-label="Branch address"
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            aria-label="Save changes"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground"
            onClick={handleCancel}
            aria-label="Cancel editing"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2 text-muted-foreground hover:text-foreground"
        onClick={() => setEditing(true)}
        aria-label="Edit branch"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-3 text-xs"
        onClick={handleToggle}
        disabled={toggling}
        aria-label={branch.isActive ? 'Deactivate branch' : 'Activate branch'}
      >
        {toggling ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : branch.isActive ? (
          'Deactivate'
        ) : (
          'Activate'
        )}
      </Button>
    </div>
  );
}
