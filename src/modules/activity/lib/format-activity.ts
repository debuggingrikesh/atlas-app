 

export function formatActivityAction(action: string): string {
  switch (action) {
    case 'business.created':
      return 'created the business';
    case 'business.updated':
      return 'updated business settings';
    case 'invitation.created':
      return 'invited a new member';
    case 'invitation.accepted':
      return 'joined the team';
    case 'invitation.cancelled':
      return 'cancelled an invitation';
    case 'invitation.resent':
      return 'resent an invitation';
    case 'member.removed':
      return 'removed a member';
    case 'role.created':
      return 'created a role';
    case 'role.updated':
      return 'updated a role';
    case 'role.deleted':
      return 'deleted a role';
    case 'business_member.created':
      return 'was added to the business';
    case 'branch.updated':
      return 'updated branch details';
    default:
      // Fallback for unknown/future events:
      // "custom.event.name" -> "performed custom event name"
      return `performed ${action.replace(/\./g, ' ')}`;
  }
}

export function formatRelativeTime(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

