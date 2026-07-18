'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
      <Button 
        variant={currentPlanCode === 'PRO' ? 'default' : 'outline'} 
        disabled={loading !== null || currentPlanCode === 'PRO'}
        onClick={() => handleUpdate('PRO')}
      >
        {loading === 'PRO' ? 'Updating...' : 'Upgrade to PRO'}
      </Button>

      <Button 
        variant={currentPlanCode === 'TRIAL' ? 'default' : 'outline'} 
        disabled={loading !== null || currentPlanCode === 'TRIAL'}
        onClick={() => handleUpdate('TRIAL')}
      >
        {loading === 'TRIAL' ? 'Updating...' : 'Set to TRIAL'}
      </Button>

      <Button 
        variant={currentPlanCode === 'FREE' ? 'default' : 'outline'} 
        disabled={loading !== null || currentPlanCode === 'FREE'}
        onClick={() => handleUpdate('FREE')}
      >
        {loading === 'FREE' ? 'Updating...' : 'Downgrade to FREE'}
      </Button>
    </div>
  );
}
