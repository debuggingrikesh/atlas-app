'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FormState = {
  error?: string;
  success?: boolean;
} | undefined;

async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

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

  return { success: true };
}

export function SignupForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(signupAction, undefined);

  useEffect(() => {
    if (state?.success) {
      router.push('/onboarding/step/1');
    }
  }, [state?.success, router]);

  if (state?.success) {
    return null;
  }

  return (
    <form action={action} className="space-y-5">
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
        />
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

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium underline underline-offset-4 hover:text-foreground">
          Sign in
        </Link>
      </p>
    </form>
  );
}
