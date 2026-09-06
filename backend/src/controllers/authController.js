import * as authService from '../services/authService.js';
import { listLoginHistory } from '../services/loginHistoryService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getRequestContext } from '../utils/requestContext.js';
import { env } from '../config/env.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { ipAddress, userAgent } = getRequestContext(req);

  const result = await authService.login({ email, password, ipAddress, userAgent });

  res.json({
    success: true,
    message: `Welcome back, ${result.user.fullName}.`,
    data: {
      ...result,
      sessionTimeoutMinutes: env.auth.sessionTimeoutMinutes,
    },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refreshSession(req.body.refreshToken);

  res.json({
    success: true,
    message: 'Session refreshed.',
    data: {
      ...result,
      sessionTimeoutMinutes: env.auth.sessionTimeoutMinutes,
    },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getRequestContext(req);

  await authService.logout({
    userId: req.user.id,
    email: req.user.email,
    accessToken: req.accessToken,
    ipAddress,
    userAgent,
  });

  res.json({ success: true, message: 'You have been signed out.' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

export const loginHistory = asyncHandler(async (req, res) => {
  const history = await listLoginHistory(req.user.id);
  res.json({ success: true, data: { history } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getRequestContext(req);

  await authService.requestPasswordReset({ email: req.body.email, ipAddress, userAgent });

  // Same response regardless of whether the email is registered.
  res.json({
    success: true,
    message: 'If that email belongs to an authority account, a reset link is on its way.',
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getRequestContext(req);

  await authService.resetPassword({
    accessToken: req.body.accessToken,
    newPassword: req.body.newPassword,
    ipAddress,
    userAgent,
  });

  res.json({ success: true, message: 'Password updated. You can sign in with it now.' });
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword({
    userId: req.user.id,
    email: req.user.email,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
  });

  res.json({ success: true, message: 'Your password has been changed.' });
});
