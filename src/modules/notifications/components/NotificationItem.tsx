 

'use client';

import { Button } from '@/components/ui/button';
import type { NotificationItem as NotificationItemType } from '@/modules/notifications/types';
import { useState } from 'react';

export function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: NotificationItemType;
  onMarkRead: (id: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleRead = async () => {
    if (notification.readAt) return;
    setLoading(true);
    try {
      await onMarkRead(notification.id);
    } finally {
      setLoading(false);
    }
  };

  const isUnread = !notification.readAt;
  
  // Custom relative time formatting if date-fns is missing, but here we can just write our own if needed.
  // Actually, we built `formatRelativeTime` in activity, let's use that to avoid dependency issues.
  return (
    <div className={`p-4 border-b flex justify-between items-start transition-colors ${isUnread ? 'bg-blue-50/50' : ''}`}>
      <div className="flex flex-col gap-1 pr-4">
        <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
        <p className="text-sm text-gray-600">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(notification.createdAt).toLocaleString()}
        </p>
      </div>
      {isUnread && (
        <Button variant="ghost" size="sm" onClick={handleRead} disabled={loading} className="text-xs h-8">
          Mark read
        </Button>
      )}
    </div>
  );
}
