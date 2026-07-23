import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

/**
 * Validates internal requests from HQ using a shared generalized credential.
 * Scope: This secret permits read-only access to generalized operational 
 * data (like audit logs and operational metrics) from HQ to App.
 * Rotation: To rotate, update HQ_INTERNAL_API_SECRET in both App and HQ environments simultaneously.
 */
export async function verifyInternalRequest(): Promise<boolean> {
  const h = await headers();
  const authHeader = h.get('Authorization');
  const secret = process.env.HQ_INTERNAL_API_SECRET;
  const previousSecret = process.env.HQ_INTERNAL_API_SECRET_PREVIOUS;

  if (!secret) {
    logger.warn('HQ_INTERNAL_API_SECRET is not configured on this server');
    return false;
  }

  if (authHeader !== `Bearer ${secret}` && authHeader !== `Bearer ${previousSecret}`) {
    logger.warn('Invalid or missing internal API credential');
    return false;
  }

  return true;
}
