import { ReputationRepository } from '../repositories/reputation-repository';
import { resolvePermissions } from '@/lib/permissions/resolve-permissions';
import { PERMISSIONS } from '@atlas/core/auth';
import type { BusinessWithMembership } from '@/modules/business/types';

import { cache } from 'react';

export class ReputationSummaryService {
  /**
   * Retrieves reputation summary statistics for the dashboard.
   * Ensures the user has the 'reputation.view' permission.
   */
  static getSummary = cache(async (businessId: string, membership: BusinessWithMembership) => {
    const perms = resolvePermissions(membership);

    if (!perms.hasPermission(PERMISSIONS.reputation.view)) {
      return null;
    }

    return ReputationRepository.getOverviewStats(businessId);
  });
}

