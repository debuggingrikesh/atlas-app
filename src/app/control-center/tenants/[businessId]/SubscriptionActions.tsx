'use client';

import { useState } from 'react';
import { LoadingButton } from '@/components/ui/loading/LoadingButton';
import { changeSubscriptionPlan } from './actions';
import { toast } from 'sonner';

export function SubscriptionActions({ businessId, currentPlanCode }: { businessId: string, currentPlanCode?: string }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpdate = async (planCode: string) => {
    setLoading(planCode);
    try {
      await changeSubscriptionPlan(businessId, planCode);
      toast.success(`Subscription updated to ${planCode}`);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to update subscription');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <LoadingButton 
        variant={currentPlanCode === 'PRO' ? 'default' : 'outline'} 
        disabled={currentPlanCode === 'PRO'}
        isLoading={loading === 'PRO'}
        loadingText="Updating..."
        onClick={() => handleUpdate('PRO')}
      >
        Upgrade to PRO
      </LoadingButton>

      <LoadingButton 
        variant={currentPlanCode === 'TRIAL' ? 'default' : 'outline'} 
        disabled={currentPlanCode === 'TRIAL'}
        isLoading={loading === 'TRIAL'}
        loadingText="Updating..."
        onClick={() => handleUpdate('TRIAL')}
      >
        Set to TRIAL
      </LoadingButton>

      <LoadingButton 
        variant={currentPlanCode === 'FREE' ? 'default' : 'outline'} 
        disabled={currentPlanCode === 'FREE'}
        isLoading={loading === 'FREE'}
        loadingText="Updating..."
        onClick={() => handleUpdate('FREE')}
      >
        Downgrade to FREE
      </LoadingButton>
    </div>
  );
}
