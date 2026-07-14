export const NOTIFICATION_EVENTS = {
  INVITATION_RECEIVED: 'invitation.received',
  INVITATION_ACCEPTED: 'invitation.accepted',
  ROLE_CHANGED: 'role.changed',
  BUSINESS_UPDATED: 'business.updated',
} as const;

export type NotificationEventType = typeof NOTIFICATION_EVENTS[keyof typeof NOTIFICATION_EVENTS];
