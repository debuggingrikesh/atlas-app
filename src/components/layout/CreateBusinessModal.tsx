/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading/LoadingButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Template {
  id: string;
  name: string;
}

interface CreateBusinessModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateBusinessModal({ open, onClose }: CreateBusinessModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [form, setForm] = useState({ name: '', industryTemplateId: '' });

  useEffect(() => {
    if (open && templates.length === 0) {
      fetch('/api/industry/templates')
        .then((r) => r.json())
        .then((data) => setTemplates(data.data?.templates ?? []))
        .catch(() => setTemplates([]));
    }
  }, [open, templates.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to create business.');
      }

      // Switch to the newly created business
      const newBusiness = data.data?.business;
      if (newBusiness?.id) {
        localStorage.setItem('activeBusinessId', newBusiness.id);
        document.cookie = `activeBusinessId=${newBusiness.id}; path=/; max-age=31536000`;
      }

      onClose();
      // Full reload so the dashboard layout re-fetches the updated business list
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-business-modal-title"
    >
      <div className="relative w-full max-w-md rounded-xl border bg-background p-6 shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 id="create-business-modal-title" className="text-lg font-semibold">
              Create a new business
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your account supports multiple businesses.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted text-muted-foreground"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cb-name">Business Name</Label>
            <Input
              id="cb-name"
              required
              placeholder="e.g. Acme Corp"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cb-industry">Industry</Label>
            <select
              id="cb-industry"
              required
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={form.industryTemplateId}
              onChange={(e) => setForm({ ...form, industryTemplateId: e.target.value })}
            >
              <option value="">Select an industry…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <LoadingButton type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </LoadingButton>
            <LoadingButton type="submit" disabled={!form.name || !form.industryTemplateId} isLoading={loading} loadingText="Creating business...">
              Create Business
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}
