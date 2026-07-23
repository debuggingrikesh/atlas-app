/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useState } from 'react';

import { Building2, Check, Loader2, XCircle } from 'lucide-react';

interface AcceptInvitationClientProps {
  token: string;
  businessName: string;
  roleName: string;
  inviterEmail: string; // The email of the person invited (or we can just show the role)
}

export function AcceptInvitationClient({
  token,
  businessName,
  roleName,
}: AcceptInvitationClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to accept invitation');
      }

      // Success! Hard redirect to the root to ensure a fresh server render
      // which will resolve the active dashboard based on the new membership.
      window.location.assign('/');
    } catch (err: any) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md w-full rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight">You are joining {businessName}</h2>
        <div className="mt-4 space-y-2 rounded-lg bg-muted/50 w-full p-4 text-left border">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Your Role</p>
          <p className="text-base font-semibold">{roleName}</p>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <XCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <button
          onClick={handleAccept}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {loading ? 'Joining...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
