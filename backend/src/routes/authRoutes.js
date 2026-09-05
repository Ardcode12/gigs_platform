import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { loginLimiter, passwordResetLimiter } from '../middleware/rateLimit.js';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshSchema,
} from '../validators/authSchemas.js';

const router = Router();

// --- Public ---
router.post('/login', loginLimiter, validateBody(loginSchema), authController.login);
router.post('/refresh', validateBody(refreshSchema), authController.refresh);
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  passwordResetLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

// --- Authenticated ---
router.get('/me', requireAuth, authController.me);
router.get('/login-history', requireAuth, authController.loginHistory);
router.post('/logout', requireAuth, authController.logout);
router.post(
  '/change-password',
  requireAuth,
  validateBody(changePasswordSchema),
  authController.changePassword
);

export default router;
