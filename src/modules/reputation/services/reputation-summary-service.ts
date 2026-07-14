import { ReputationRepository } from '../repositories/reputation-repository';
import { resolvePermissions } from '@/lib/permissions/resolve-permissions';
import { PERMISSIONS } from '@/lib/permissions/permissions';
import type { BusinessWithMembership } from '@/modules/business/types';

export class ReputationSummaryService {
  /**
   * Retrieves reputation summary statistics for the dashboard.
   * Ensures the user has the 'reputation.view' permission.
   */
  static async getSummary(businessId: string, membership: BusinessWithMembership) {
    const perms = resolvePermissions(membership);

    if (!perms.hasPermission(PERMISSIONS.reputation.view)) {
      return null;
    }

    return ReputationRepository.getOverviewStats(businessId);
  }
}

