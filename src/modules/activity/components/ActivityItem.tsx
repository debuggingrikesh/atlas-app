'use client';

import Image from 'next/image';
import { formatActivityAction, formatRelativeTime } from '@/modules/activity/lib/format-activity';
import type { ActivityItem as ActivityItemType } from '@/modules/activity/types';

export function ActivityItem({ item }: { item: ActivityItemType }) {
  const actorName = item.actor?.fullName || item.actor?.email || 'System';
  const actionText = formatActivityAction(item.action);
  const timeAgo = formatRelativeTime(item.occurredAt);

  const renderRichContent = () => {
    // metadata is a JSON field in Prisma, which translates to any / Prisma.JsonValue. 
    // We cast it to a more usable type here.
    const meta = item.metadata as {
      changes?: Record<string, unknown>;
      previous?: Record<string, unknown>;
      previousRole?: string;
      newRole?: string;
    };
    
    if (item.action === 'business.updated' && meta?.changes && meta?.previous) {
      return (
        <div className="mt-1 text-sm text-gray-700 bg-gray-50 rounded-md p-2 border">
          {Object.entries(meta.changes).map(([key, newVal]) => {
            const oldVal = meta.previous![key];
            if (newVal === oldVal) return null;
            return (
              <div key={key} className="mb-1 last:mb-0">
                <span className="font-medium capitalize">{key}:</span>{' '}
                <span className="line-through text-gray-400 mr-1">{String(oldVal || 'None')}</span>
                <span className="text-gray-900">→ {String(newVal || 'None')}</span>
              </div>
            );
          })}
        </div>
      );
    }

    if (item.action === 'branch.updated' && meta?.changes && meta?.previous) {
      return (
        <div className="mt-1 text-sm text-gray-700 bg-gray-50 rounded-md p-2 border">
          <p className="font-medium mb-1">Changes to {String(meta.previous!.name)}:</p>
          {Object.entries(meta.changes).map(([key, newVal]) => {
            const oldVal = meta.previous![key];
            if (newVal === oldVal) return null;
            return (
              <div key={key} className="mb-1 last:mb-0 ml-2">
                <span className="font-medium capitalize">{key}:</span>{' '}
                <span className="line-through text-gray-400 mr-1">{String(oldVal ?? 'None')}</span>
                <span className="text-gray-900">→ {String(newVal ?? 'None')}</span>
              </div>
            );
          })}
        </div>
      );
    }

    if (item.action === 'member.role_updated' && meta?.previousRole && meta?.newRole) {
      return (
        <div className="mt-1 text-sm text-gray-700 bg-gray-50 rounded-md p-2 border flex items-center gap-2">
          <span className="font-medium text-gray-500 line-through">{meta.previousRole}</span>
          <span>→</span>
          <span className="font-medium text-gray-900">{meta.newRole}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 mt-1">
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 overflow-hidden">
          {item.actor?.avatarUrl ? (
            <Image src={item.actor.avatarUrl} alt={actorName} width={32} height={32} className="h-full w-full object-cover" unoptimized />
          ) : (
            <span>{actorName.charAt(0).toUpperCase()}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col w-full">
        <div className="flex items-baseline justify-between w-full">
          <p className="text-sm text-gray-900">
            <span className="font-semibold">{actorName}</span> {actionText}
          </p>
          <p className="text-xs text-gray-500 whitespace-nowrap ml-4">{timeAgo}</p>
        </div>
        {renderRichContent()}
      </div>
    </div>
  );
}
