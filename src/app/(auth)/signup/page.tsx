import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SignupForm } from '@/modules/auth/components/SignupForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Create an account — Project Atlas',
  description: 'Create your Project Atlas account to get started.',
};

export default function SignupPage() {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
        <CardDescription>Enter your email below to create your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading...</div>}>
          <SignupForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
