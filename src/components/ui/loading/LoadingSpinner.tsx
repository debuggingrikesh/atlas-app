import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-3 w-3',
  default: 'h-4 w-4',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

export function LoadingSpinner({ className, size = 'default' }: LoadingSpinnerProps) {
  return (
    <Loader2 
      className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)} 
      aria-label="Loading"
    />
  );
}
