'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface Step1FormProps {
  defaultValue?: string;
  onNext: (data: { fullName: string }) => void;
  submitting?: boolean;
  error?: string;
}

export function Step1ProfileForm({ defaultValue, onNext, submitting, error }: Step1FormProps) {
  const [fullName, setFullName] = useState(defaultValue ?? '');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = fullName.trim();
    if (trimmed.length >= 2) {
      onNext({ fullName: trimmed });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fullName">Your full name</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={100}
          placeholder="e.g. Rikesh Karmacharya"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoFocus
          disabled={submitting}
        />
        <p className="text-xs text-muted-foreground">This is how your name will appear in the platform.</p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={fullName.trim().length < 2 || submitting}>
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Continue →'}
      </Button>
    </form>
  );
}
