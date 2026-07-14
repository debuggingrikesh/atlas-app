export const PERMISSIONS = {
  business: {
    read: "business.read",
    update: "business.update",
    delete: "business.delete"
  },
  branch: {
    read: "branch.read",
    create: "branch.create",
    update: "branch.update",
    delete: "branch.delete"
  },
  member: {
    read: "member.read",
    invite: "member.invite",
    remove: "member.remove",
    roleUpdate: "member.role_update"
  },
  role: {
    read: "role.read",
    create: "role.create",
    update: "role.update",
    delete: "role.delete",
    manage: "role.manage"
  },
  activity: {
    read: "activity.read"
  },
  owner: {
    transfer: "owner.transfer"
  },
  billing: {
    manage: "billing.manage"
  },
  settings: {
    manage: "settings.manage"
  },
  reputation: {
    view: "reputation.view",
    manage: "reputation.manage",
    settingsManage: "reputation.settings_manage",
    requestCreate: "reputation.request_create",
    feedbackView: "reputation.feedback_view",
    aiResponseGenerate: "reputation.ai_response_generate",
    aiSettingsManage: "reputation.ai_settings_manage"
  }
} as const;



// Assignable permissions are those that an OWNER can assign to a custom role.
// We strictly exclude dangerous permissions.
export const ASSIGNABLE_PERMISSIONS = [
  PERMISSIONS.business.read,
  PERMISSIONS.business.update,
  PERMISSIONS.branch.read,
  PERMISSIONS.branch.create,
  PERMISSIONS.branch.update,
  PERMISSIONS.branch.delete,
  PERMISSIONS.member.read,
  PERMISSIONS.member.invite,
  PERMISSIONS.member.remove,
  PERMISSIONS.member.roleUpdate,
  PERMISSIONS.role.read,
  PERMISSIONS.activity.read,
  PERMISSIONS.settings.manage,
  PERMISSIONS.reputation.view,
  PERMISSIONS.reputation.manage,
  PERMISSIONS.reputation.settingsManage,
  PERMISSIONS.reputation.requestCreate,
  PERMISSIONS.reputation.feedbackView,
  PERMISSIONS.reputation.aiResponseGenerate,
  PERMISSIONS.reputation.aiSettingsManage
];
