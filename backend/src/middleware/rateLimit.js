import rateLimit from 'express-rate-limit';

const jsonLimitResponse = (message) => (req, res) => {
  res.status(429).json({ success: false, message });
};

/**
 * Tight limit on credential-checking endpoints. This is per-IP and sits in
 * front of the per-account lockout in authService, which is per-account --
 * together they cover both a single account under attack and one IP spraying
 * many accounts.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonLimitResponse(
    'Too many sign-in attempts from this network. Please try again in 15 minutes.'
  ),
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonLimitResponse(
    'Too many password reset requests. Please try again in an hour.'
  ),
});

/** Broad backstop for everything else. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonLimitResponse('Too many requests. Please slow down.'),
});
