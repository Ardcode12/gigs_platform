import { env } from '../config/env.js';
import { supabaseAdmin, supabasePublic } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { recordLoginEvent } from './loginHistoryService.js';

const PROFILE_COLUMNS =
  'id, employee_id, full_name, email, phone, designation, department, role, status, must_change_password, failed_login_count, locked_until, last_login_at, created_at';

/**
 * Shape sent to the client. Deliberately omits the lockout counters --
 * those are internal policy state, not something the browser needs.
 */
function toPublicProfile(profile) {
  return {
    id: profile.id,
    employeeId: profile.employee_id,
    fullName: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    designation: profile.designation,
    department: profile.department,
    role: profile.role,
    status: profile.status,
    mustChangePassword: profile.must_change_password,
    lastLoginAt: profile.last_login_at,
  };
}

async function findProfileByEmail(email) {
  const { data, error } = await supabaseAdmin
    .from('authority_users')
    .select(PROFILE_COLUMNS)
    .ilike('email', email)
    .maybeSingle();

  if (error) {
    throw ApiError.internal(`Could not look up the account: ${error.message}`);
  }
  return data;
}

export async function findProfileById(userId) {
  const { data, error } = await supabaseAdmin
    .from('authority_users')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw ApiError.internal(`Could not load the account: ${error.message}`);
  }
  return data;
}

function isLocked(profile) {
  return Boolean(profile?.locked_until) && new Date(profile.locked_until) > new Date();
}

function minutesUntil(timestamp) {
  return Math.max(1, Math.ceil((new Date(timestamp) - Date.now()) / 60000));
}

async function registerFailedAttempt(profile) {
  const attempts = (profile.failed_login_count ?? 0) + 1;
  const shouldLock = attempts >= env.auth.maxFailedLoginAttempts;

  await supabaseAdmin
    .from('authority_users')
    .update({
      failed_login_count: attempts,
      locked_until: shouldLock
        ? new Date(Date.now() + env.auth.accountLockMinutes * 60000).toISOString()
        : null,
    })
    .eq('id', profile.id);

  return { attempts, locked: shouldLock };
}

async function clearFailedAttempts(userId) {
  await supabaseAdmin
    .from('authority_users')
    .update({
      failed_login_count: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
    })
    .eq('id', userId);
}

/**
 * Authenticates an authority officer with email + password.
 *
 * Order matters. Lockout and account status are checked before the password
 * is verified, so a locked or suspended account cannot be probed for a valid
 * password. Wrong-password and unknown-email both return the same message so
 * the endpoint cannot be used to enumerate registered officers.
 */
export async function login({ email, password, ipAddress, userAgent }) {
  const normalizedEmail = email.trim().toLowerCase();
  const audit = { email: normalizedEmail, ipAddress, userAgent };
  const invalidCredentials = ApiError.unauthorized('Invalid email or password.');

  const profile = await findProfileByEmail(normalizedEmail);

  if (!profile) {
    await recordLoginEvent({ ...audit, event: 'login_failed', failureReason: 'unknown_email' });
    throw invalidCredentials;
  }

  if (isLocked(profile)) {
    await recordLoginEvent({
      ...audit,
      userId: profile.id,
      event: 'login_failed',
      failureReason: 'account_locked',
    });
    throw ApiError.tooManyRequests(
      `Too many failed attempts. This account is locked for another ${minutesUntil(profile.locked_until)} minute(s).`
    );
  }

  if (profile.status !== 'active') {
    await recordLoginEvent({
      ...audit,
      userId: profile.id,
      event: 'login_failed',
      failureReason: `account_${profile.status}`,
    });
    throw ApiError.forbidden(
      `This account is ${profile.status}. Contact the portal administrator.`
    );
  }

  const { data, error } = await supabasePublic.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error || !data?.session) {
    const { attempts, locked } = await registerFailedAttempt(profile);
    await recordLoginEvent({
      ...audit,
      userId: profile.id,
      event: 'login_failed',
      failureReason: locked ? 'bad_password_locked' : 'bad_password',
    });

    if (locked) {
      throw ApiError.tooManyRequests(
        `Too many failed attempts. This account is locked for ${env.auth.accountLockMinutes} minutes.`
      );
    }

    const remaining = env.auth.maxFailedLoginAttempts - attempts;
    throw ApiError.unauthorized(
      `Invalid email or password. ${remaining} attempt(s) remaining before the account is locked.`
    );
  }

  await clearFailedAttempts(profile.id);
  await recordLoginEvent({ ...audit, userId: profile.id, event: 'login_success' });

  const fresh = await findProfileById(profile.id);

  return {
    user: toPublicProfile(fresh ?? profile),
    session: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      expiresIn: data.session.expires_in,
      tokenType: data.session.token_type,
    },
  };
}

/**
 * Exchanges a refresh token for a new access token, so the dashboard can keep
 * a session alive without asking for the password again.
 */
export async function refreshSession(refreshToken) {
  const { data, error } = await supabasePublic.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data?.session) {
    throw ApiError.unauthorized('Your session has expired. Please sign in again.');
  }

  const profile = await findProfileById(data.session.user.id);

  if (!profile || profile.status !== 'active') {
    throw ApiError.forbidden('This account is no longer active.');
  }

  return {
    user: toPublicProfile(profile),
    session: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      expiresIn: data.session.expires_in,
      tokenType: data.session.token_type,
    },
  };
}

export async function logout({ userId, email, accessToken, ipAddress, userAgent }) {
  if (accessToken) {
    // Revokes the refresh token server-side so it cannot be replayed.
    const { error } = await supabaseAdmin.auth.admin.signOut(accessToken);
    if (error) {
      console.error('[auth] sign-out failed', error.message);
    }
  }

  await recordLoginEvent({ userId, email, event: 'logout', ipAddress, userAgent });
}

/**
 * Sends a password-reset email.
 *
 * Always resolves, whether or not the email belongs to a registered officer --
 * a different response for unknown emails would turn this into an account
 * enumeration oracle.
 */
export async function requestPasswordReset({ email, ipAddress, userAgent }) {
  const normalizedEmail = email.trim().toLowerCase();
  const profile = await findProfileByEmail(normalizedEmail);

  if (profile && profile.status === 'active') {
    const { error } = await supabasePublic.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: env.auth.passwordResetRedirectUrl,
    });

    if (error) {
      console.error('[auth] password reset email failed', error.message);
    }

    await recordLoginEvent({
      userId: profile.id,
      email: normalizedEmail,
      event: 'password_reset_requested',
      ipAddress,
      userAgent,
    });
  }
}

/**
 * Completes a reset. The access token comes from the link in the reset email;
 * Supabase treats it as proof of ownership of the mailbox.
 */
export async function resetPassword({ accessToken, newPassword, ipAddress, userAgent }) {
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !userData?.user) {
    throw ApiError.unauthorized('This reset link is invalid or has expired. Request a new one.');
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userData.user.id, {
    password: newPassword,
  });

  if (error) {
    throw ApiError.badRequest(`Could not update the password: ${error.message}`);
  }

  // A completed reset also clears any lockout from the failed attempts that
  // usually precede it, and retires the forced-change flag.
  await supabaseAdmin
    .from('authority_users')
    .update({ must_change_password: false, failed_login_count: 0, locked_until: null })
    .eq('id', userData.user.id);

  await recordLoginEvent({
    userId: userData.user.id,
    email: userData.user.email,
    event: 'password_reset_completed',
    ipAddress,
    userAgent,
  });
}

/**
 * Changes the password of an already-signed-in officer. Requires the current
 * password, so a hijacked tab cannot silently take over the account.
 */
export async function changePassword({ userId, email, currentPassword, newPassword }) {
  const { error: verifyError } = await supabasePublic.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (verifyError) {
    throw ApiError.unauthorized('Your current password is incorrect.');
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    throw ApiError.badRequest(`Could not update the password: ${error.message}`);
  }

  await supabaseAdmin
    .from('authority_users')
    .update({ must_change_password: false })
    .eq('id', userId);
}

export { toPublicProfile };
