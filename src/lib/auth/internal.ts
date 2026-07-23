 

import { headers } from 'next/headers';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

function safeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

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

  const isCurrentMatch = safeCompare(authHeader, `Bearer ${secret}`);
  const isPreviousMatch = previousSecret ? safeCompare(authHeader, `Bearer ${previousSecret}`) : false;

  if (!isCurrentMatch && !isPreviousMatch) {
    logger.warn('Invalid or missing internal API credential');
    return false;
  }

  return true;
}
