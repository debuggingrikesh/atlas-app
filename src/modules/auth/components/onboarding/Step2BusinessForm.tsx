 

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Step2FormProps {
  defaultValue?: string;
  onNext: (data: { businessName: string }) => void;
  onBack: () => void;
}

function toSlugPreview(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function Step2BusinessForm({ defaultValue, onNext, onBack }: Step2FormProps) {
  const [name, setName] = useState(defaultValue ?? '');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length >= 2) {
      onNext({ businessName: trimmed });
    }
  }

  const slugPreview = toSlugPreview(name);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="businessName">Business name</Label>
        <Input
          id="businessName"
          name="businessName"
          type="text"
          required
          minLength={2}
          maxLength={100}
          placeholder="e.g. VXL Education Nepal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        {slugPreview && (
          <p className="text-xs text-muted-foreground">
            URL identifier:{' '}
            <span className="font-mono font-medium text-foreground">{slugPreview}</span>
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          ← Back
        </Button>
        <Button type="submit" className="flex-1">
          Continue →
        </Button>
      </div>
    </form>
  );
}
