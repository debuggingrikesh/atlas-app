/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import { AsyncFeedbackState, AsyncState } from './AsyncFeedbackState';
import { Sparkles } from 'lucide-react';

const AI_PHASES = [
  'Analyzing feedback...',
  'Understanding customer sentiment...',
  'Identifying customer emotion...',
  'Preparing recommendation...',
];

interface AILoadingStateProps {
  status: AsyncState;
  onRetry?: () => void;
  children?: React.ReactNode;
}

export function AILoadingState({ status, onRetry, children }: AILoadingStateProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    if (status !== 'loading') return;
    
    // Cycle through phases every 2 seconds while loading
    const interval = setInterval(() => {
      setPhaseIndex((current) => (current < AI_PHASES.length - 1 ? current + 1 : current));
    }, 2000);

    return () => clearInterval(interval);
  }, [status]);

  // Reset phase when we enter loading
  if (status === 'loading' && phaseIndex === AI_PHASES.length && false) {
    // Just a placeholder, we use useEffect to increment so it starts at 0.
    // If we wanted to reset, we could do it during render.
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-primary animate-in fade-in zoom-in-95">
        <Sparkles className="h-8 w-8 animate-pulse" />
        <p className="text-sm font-medium animate-pulse">{AI_PHASES[phaseIndex]}</p>
      </div>
    );
  }

  return (
    <AsyncFeedbackState 
      status={status} 
      successMessage="Analysis ready"
      errorMessage="Unable to complete analysis"
      onRetry={onRetry}
    >
      {children}
    </AsyncFeedbackState>
  );
}
