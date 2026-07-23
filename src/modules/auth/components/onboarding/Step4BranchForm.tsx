 

'use client';

import { useState } from 'react';
import { LoadingButton } from '@/components/ui/loading/LoadingButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Step4FormProps {
  defaultBranchName?: string;
  defaultAddress?: string;
  onNext: (data: { branchName: string; branchAddress?: string }) => void;
  onBack: () => void;
  submitting?: boolean;
  error?: string;
}

export function Step4BranchForm({
  defaultBranchName,
  defaultAddress,
  onNext,
  onBack,
  submitting,
  error,
}: Step4FormProps) {
  const [branchName, setBranchName] = useState(defaultBranchName ?? '');
  const [address, setAddress] = useState(defaultAddress ?? '');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedName = branchName.trim();
    if (trimmedName.length >= 2) {
      onNext({
        branchName: trimmedName,
        branchAddress: address.trim() || undefined,
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="branchName">Branch name</Label>
        <Input
          id="branchName"
          name="branchName"
          type="text"
          required
          minLength={2}
          maxLength={100}
          placeholder="e.g. Main Branch, Baneshwor"
          value={branchName}
          onChange={(e) => setBranchName(e.target.value)}
          disabled={submitting}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          You can add more branches later from the dashboard.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="branchAddress">
          Address <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="branchAddress"
          name="branchAddress"
          type="text"
          maxLength={255}
          placeholder="e.g. Baneshwor, Kathmandu"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={submitting}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={submitting}>
          ← Back
        </Button>
        <LoadingButton type="submit" className="flex-1" disabled={branchName.trim().length < 2} isLoading={submitting} loadingText="Setting up your business...">
          Complete setup →
        </LoadingButton>
      </div>
    </form>
  );
}
