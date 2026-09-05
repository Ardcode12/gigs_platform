import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * Admin client -- uses the secret key and bypasses Row Level Security.
 * Use for reading/writing the authority_users directory and login_history,
 * and for verifying access tokens. Never send this client's key to a browser.
 */
export const supabaseAdmin = createClient(env.supabase.url, env.supabase.secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Public client -- uses the publishable key. Used for password sign-in and
 * password-reset emails, which must run against the anon-facing auth endpoint.
 *
 * Sessions are not persisted: this is a stateless API, and a shared module-level
 * client persisting a session would leak one user's session into another's request.
 */
export const supabasePublic = createClient(env.supabase.url, env.supabase.publishableKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
