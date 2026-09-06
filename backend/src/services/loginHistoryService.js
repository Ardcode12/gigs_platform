import { supabaseAdmin } from '../config/supabase.js';

/**
 * Appends an authentication event to login_history.
 *
 * Auditing must never break the request it is auditing: a failure here is
 * logged to the console and swallowed, so a login still succeeds even if the
 * history insert does not.
 */
export async function recordLoginEvent({
  userId = null,
  email,
  event,
  ipAddress = null,
  userAgent = null,
  failureReason = null,
}) {
  const { error } = await supabaseAdmin.from('login_history').insert({
    user_id: userId,
    email: email.toLowerCase(),
    event,
    ip_address: ipAddress,
    user_agent: userAgent,
    failure_reason: failureReason,
  });

  if (error) {
    console.error('[login_history] failed to record event', { event, email, error: error.message });
  }
}

/**
 * Most recent authentication events for one officer, newest first.
 */
export async function listLoginHistory(userId, limit = 20) {
  const { data, error } = await supabaseAdmin
    .from('login_history')
    .select('id, event, ip_address, user_agent, failure_reason, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Could not read login history: ${error.message}`);
  }

  return data ?? [];
}
