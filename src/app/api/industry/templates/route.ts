/* eslint-disable @typescript-eslint/no-explicit-any */

import { getActiveTemplates } from '@/modules/industry/lib/get-templates';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * GET /api/industry/templates
 *
 * Public endpoint — no authentication required.
 * Returns all active IndustryTemplate records.
 * Cached for 1 hour (s-maxage) to avoid redundant DB queries.
 */
export async function GET() {
  try {
    const templates = await getActiveTemplates();

    const response = successResponse({ templates });

    // Cache at CDN/edge for 1 hour; revalidate in background after 30 minutes
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=1800');

    return response;
  } catch (err) {
    console.error('[industry/templates GET] Unexpected error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
