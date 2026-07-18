import { PERMISSIONS } from './permissions';

export const SYSTEM_ROLE_PERMISSIONS: Record<'OWNER' | 'ADMIN' | 'MEMBER', string[]> = {
  OWNER: Object.values(PERMISSIONS).flatMap((group) => Object.values(group)),
  ADMIN: [
    PERMISSIONS.business.read,
    PERMISSIONS.business.update,
    PERMISSIONS.member.read,
    PERMISSIONS.member.invite,
    PERMISSIONS.branch.read,
    PERMISSIONS.branch.create,
    PERMISSIONS.branch.update,
    PERMISSIONS.branch.delete,
    PERMISSIONS.activity.read,
    PERMISSIONS.settings.manage,
    PERMISSIONS.reputation.view,
    PERMISSIONS.reputation.manage,
    PERMISSIONS.reputation.settingsManage,
    PERMISSIONS.reputation.requestCreate,
    PERMISSIONS.reputation.feedbackView,
    PERMISSIONS.reputation.aiSettingsManage,
  ],
  MEMBER: [
    PERMISSIONS.business.read,
    PERMISSIONS.member.read,
    PERMISSIONS.branch.read,
    PERMISSIONS.activity.read,
    PERMISSIONS.reputation.view,
  ],
};

export const DEFAULT_ADMIN_PERMISSIONS = SYSTEM_ROLE_PERMISSIONS.ADMIN;
export const DEFAULT_MEMBER_PERMISSIONS = SYSTEM_ROLE_PERMISSIONS.MEMBER;
