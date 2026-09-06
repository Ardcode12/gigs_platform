import { supabaseAdmin } from '../config/supabase.js';
import { findProfileById, toPublicProfile } from '../services/authService.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function readBearerToken(req) {
  const header = req.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

/**
 * Verifies the bearer token against Supabase, loads the officer's profile and
 * attaches both to the request. Rejects tokens whose account is no longer
 * active, so suspending an officer takes effect on their next request rather
 * than when their token happens to expire.
 */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = readBearerToken(req);

  if (!token) {
    throw ApiError.unauthorized('Missing access token.');
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    throw ApiError.unauthorized('Your session has expired. Please sign in again.');
  }

  const profile = await findProfileById(data.user.id);

  if (!profile) {
    throw ApiError.forbidden('This login is not linked to an authority account.');
  }

  if (profile.status !== 'active') {
    throw ApiError.forbidden(`This account is ${profile.status}. Contact the portal administrator.`);
  }

  req.accessToken = token;
  req.user = toPublicProfile(profile);
  next();
});

/**
 * Guards a route by role. Only 'authority' exists today, so this is a no-op in
 * practice -- it is here so the additional authority roles in the spec can be
 * enforced later without reworking every route.
 */
export const requireRole =
  (...allowedRoles) =>
  (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('Your role does not permit this action.'));
    }
    next();
  };
