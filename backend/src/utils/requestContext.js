/**
 * Extracts the caller's IP and user agent for the login history trail.
 * Behind a proxy, app.set('trust proxy', ...) makes req.ip honour
 * X-Forwarded-For, so we do not parse that header by hand.
 */
export function getRequestContext(req) {
  return {
    ipAddress: req.ip ?? null,
    userAgent: req.get('user-agent') ?? null,
  };
}
