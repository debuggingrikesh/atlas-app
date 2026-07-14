export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata?: unknown;
  readAt: string | null;
  createdAt: string;
}
