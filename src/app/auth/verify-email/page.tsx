 

import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';

/**
 * Reserved for future production email verification enforcement.
 * Currently bypassed during MVP testing.
 */
export const metadata: Metadata = {
  title: 'Verify your email — Atlas',
  description: 'Please check your inbox to verify your email address.',
};

export default function VerifyEmailPage() {
  return (
    <Card className="w-full max-w-md shadow-lg text-center">
      <CardHeader className="space-y-1">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl">
          ✉️
        </div>
        <CardTitle className="text-2xl font-bold">Check your inbox</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification link to your email address. Click the link to
          verify your account and continue setting up your business.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive the email? Check your spam folder, or{' '}
          <Link href="/auth/signup" className="font-medium underline underline-offset-4 hover:text-foreground">
            try signing up again
          </Link>
          .
        </p>
        <Link href="/auth/login" className={buttonVariants({ variant: "outline", className: "w-full" })}>
          Back to sign in
        </Link>
      </CardContent>
    </Card>
  );
}
