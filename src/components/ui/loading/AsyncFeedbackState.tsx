/* eslint-disable @typescript-eslint/no-explicit-any */

import { LoadingSpinner } from './LoadingSpinner';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type AsyncState = 'idle' | 'loading' | 'success' | 'error';

interface AsyncFeedbackStateProps {
  status: AsyncState;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
}

export function AsyncFeedbackState({
  status,
  loadingMessage = 'Processing...',
  successMessage = 'Success!',
  errorMessage = 'An error occurred.',
  onRetry,
  children
}: AsyncFeedbackStateProps) {
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-muted-foreground animate-in fade-in zoom-in-95">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium animate-pulse">{loadingMessage}</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-green-600 animate-in fade-in zoom-in-95">
        <CheckCircle2 className="h-8 w-8" />
        <p className="text-sm font-medium">{successMessage}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-destructive animate-in fade-in zoom-in-95">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-medium text-center">{errorMessage}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            Retry
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
