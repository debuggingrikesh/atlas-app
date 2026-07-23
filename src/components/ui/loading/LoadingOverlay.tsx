 

import { LoadingSpinner } from './LoadingSpinner';

export function LoadingOverlay({ message = 'Please wait...' }: { message?: string }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingSpinner size="lg" className="text-primary mb-4" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}
