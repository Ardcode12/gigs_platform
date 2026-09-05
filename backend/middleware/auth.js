const jwt = require('jsonwebtoken');

// Role-based auth middleware factory
const auth = (roles = []) => (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided. Please login.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach to request under appropriate key
    req.user = decoded;
    if (decoded.role === 'society')  req.society = decoded;
    if (decoded.role === 'worker')   req.worker  = decoded;
    if (decoded.role === 'customer') req.customer = decoded;

    // Role check
    if (roles.length > 0 && !roles.includes(decoded.role)) {
      return res.status(403).json({ success: false, message: 'Access denied for your account type.' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token. Please login again.' });
  }
};

module.exports = auth;
