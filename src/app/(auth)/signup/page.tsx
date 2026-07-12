import type { Metadata } from 'next';
import { SignupForm } from '@/modules/auth/components/SignupForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Create your account — Project Atlas',
  description: 'Sign up to start collecting customer feedback and insights for your business.',
};

export default function SignupPage() {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
        <CardDescription>
          Get started with Project Atlas — no credit card required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
    </Card>
  );
}
