'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LoadingButton } from '@/components/ui/loading/LoadingButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FormState = {
  error?: string;
  success?: boolean;
  redirectTo?: string;
} | undefined;

async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const returnTo = formData.get('returnTo') as string | null;

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json();

  if (!json.success) {
    return { error: json.error?.message ?? 'Failed to create account. Please try again.' };
  }

  if (returnTo && returnTo.startsWith('/invitations/')) {
    return { success: true, redirectTo: returnTo };
  } else if (returnTo && returnTo.startsWith('/')) {
    return { success: true, redirectTo: `/onboarding/step/1?returnTo=${encodeURIComponent(returnTo)}` };
  }

  return { success: true, redirectTo: '/onboarding/step/1' };
}

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '';
  const initialEmail = searchParams.get('email') || '';
  
  const [email, setEmail] = useState(initialEmail);
  const [state, action, pending] = useActionState(signupAction, undefined);

  useEffect(() => {
    if (state?.success && state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state?.success, state?.redirectTo, router]);

  if (state?.success && state.redirectTo) {
    return null;
  }

  return (
    <form action={action} className="space-y-5">
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      {initialEmail && <input type="hidden" name="email" value={initialEmail} />}
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          disabled={pending || !!initialEmail}
          readOnly={!!initialEmail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {initialEmail && (
          <p className="text-xs text-muted-foreground mt-1">
            Email is locked because you are accepting an invitation.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Min. 8 characters"
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Re-enter your password"
          disabled={pending}
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      )}

      <LoadingButton type="submit" className="w-full" isLoading={pending} loadingText="Creating account...">
        Create account
      </LoadingButton>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href={`/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`} className="font-medium underline underline-offset-4 hover:text-foreground">
          Sign in
        </Link>
      </p>
    </form>
  );
}
