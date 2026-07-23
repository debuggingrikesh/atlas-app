 

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

async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const returnTo = formData.get('returnTo') as string | null;

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json();

  if (!json.success) {
    return { error: json.error?.message ?? 'Invalid email or password.' };
  }

  // If returnTo is provided (e.g., from an invitation), redirect there
  if (returnTo && returnTo.startsWith('/')) {
    return { success: true, redirectTo: returnTo };
  }

  // Otherwise, fetch the user's profile to determine redirect destination
  const meRes = await fetch('/api/auth/me');
  const me = await meRes.json();
  
  const profile = me?.data?.profile;
  if (!profile?.onboardingCompletedAt) {
    const step = profile?.onboardingStep ?? 1;
    return { success: true, redirectTo: `/onboarding/step/${step}` };
  }

  const slug = profile?.businesses?.[0]?.slug;
  return { success: true, redirectTo: slug ? `/dashboard/${slug}` : '/onboarding/step/1' };
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '';
  const initialEmail = searchParams.get('email') || '';
  
  const [email, setEmail] = useState(initialEmail);
  const [state, action, pending] = useActionState(loginAction, undefined);

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
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          disabled={pending}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Your password"
          disabled={pending}
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      )}

      <LoadingButton type="submit" className="w-full" isLoading={pending} loadingText="Signing in...">
        Sign in
      </LoadingButton>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href={`/auth/signup${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`} className="font-medium underline underline-offset-4 hover:text-foreground">
          Create one
        </Link>
      </p>
    </form>
  );
}
