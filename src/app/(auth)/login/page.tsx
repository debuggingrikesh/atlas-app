import type { Metadata } from 'next';
import { LoginForm } from '@/modules/auth/components/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Sign in — Project Atlas',
  description: 'Sign in to your Project Atlas account to manage your customer feedback.',
};

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>Sign in to your Project Atlas account.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
