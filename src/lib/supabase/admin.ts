/**
 * Supabase Admin Client
 *
 * SERVER-ONLY. Uses the service role key which bypasses Row Level Security.
 * NEVER import this file from client components or expose it to the browser.
 * NEVER prefix SUPABASE_SERVICE_ROLE_KEY with NEXT_PUBLIC_.
 */
import { createClient } from '@supabase/supabase-js';

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase admin environment variables. ' +
        'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const supabaseAdmin = createAdminClient();
