'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ActivityItem } from './ActivityItem';
import { toast } from 'sonner';
import { Activity } from 'lucide-react';
import type { ActivityItem as ActivityItemType } from '@/modules/activity/types';

interface ActivityTimelineProps {
  businessId: string;
  initialItems: ActivityItemType[];
  initialNextCursor?: string;
}

export function ActivityTimeline({ businessId, initialItems, initialNextCursor }: ActivityTimelineProps) {
  const [items, setItems] = useState<ActivityItemType[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialNextCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (!nextCursor) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/business/${businessId}/activity?cursor=${nextCursor}&limit=20`);
      const data = await res.json();
      
      if (res.ok) {
        setItems((prev) => [...prev, ...data.data.items]);
        setNextCursor(data.data.nextCursor);
      } else {
        toast.error(data.error?.message || 'Failed to load more activity.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while fetching activity.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 flex flex-col items-center justify-center bg-white border rounded-lg shadow-sm">
        <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
          <Activity className="h-8 w-8 text-muted-foreground/70" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No activity yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Once your business starts receiving reviews and interactions, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm p-6">
      <div className="space-y-8">
        {items.map((item) => (
          <ActivityItem key={item.id} item={item} />
        ))}
      </div>

      {nextCursor && (
        <div className="mt-8 pt-4 border-t flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
