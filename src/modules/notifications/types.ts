/* eslint-disable @typescript-eslint/no-explicit-any */

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  readAt: string | null;
  createdAt: string;
}
