'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Step1FormProps {
  defaultValue?: string;
  onNext: (data: { fullName: string }) => void;
}

export function Step1ProfileForm({ defaultValue, onNext }: Step1FormProps) {
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
        />
        <p className="text-xs text-muted-foreground">This is how your name will appear in the platform.</p>
      </div>
      <Button type="submit" className="w-full" disabled={fullName.trim().length < 2}>
        Continue →
      </Button>
    </form>
  );
}
