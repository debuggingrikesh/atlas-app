'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ActivityItem } from './ActivityItem';
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
        alert(data.error?.message || 'Failed to load more activity.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while fetching activity.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-10 bg-white border rounded-lg shadow-sm">
        <p className="text-sm text-gray-500">No activity recorded yet.</p>
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
