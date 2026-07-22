import { PERMISSIONS } from '@atlas/core/auth';

export const REPUTATION_PERMISSIONS = {
  VIEW: PERMISSIONS.reputation.view,
  MANAGE: PERMISSIONS.reputation.manage,
  SETTINGS_MANAGE: PERMISSIONS.reputation.settingsManage,
  REQUEST_CREATE: PERMISSIONS.reputation.requestCreate,
  FEEDBACK_VIEW: PERMISSIONS.reputation.feedbackView,
} as const;
