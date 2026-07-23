/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { NotificationItem } from './NotificationItem';
import type { NotificationItem as NotificationItemType } from '@/modules/notifications/types';

export function NotificationDropdown({
  notifications,
  loading,
  onMarkRead,
  onMarkAllRead,
}: {
  notifications: NotificationItemType[];
  loading: boolean;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}) {
  return (
    <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto">
      <div className="p-3 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        {notifications.some(n => !n.readAt) && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-primary hover:underline font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>
      
      {loading && notifications.length === 0 ? (
        <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500">No new notifications</div>
      ) : (
        <div className="flex flex-col">
          {notifications.map((notif) => (
            <NotificationItem key={notif.id} notification={notif} onMarkRead={onMarkRead} />
          ))}
        </div>
      )}
    </div>
  );
}
