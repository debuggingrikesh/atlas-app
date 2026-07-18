import { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '@/lib/utils';

export interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  isLoading?: boolean;
  loadingText?: string;
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ children, isLoading, loadingText, disabled, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn("relative", className)}
        {...props}
      >
        {isLoading && (
          <span className="absolute left-4">
            <LoadingSpinner size="sm" className={props.variant === 'outline' || props.variant === 'ghost' ? '' : 'text-primary-foreground/70'} />
          </span>
        )}
        <span className={cn("flex items-center gap-2", isLoading && "opacity-90 pl-6")}>
          {isLoading && loadingText ? loadingText : children}
        </span>
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';
