/**
 * Admin Authentication Middleware
 * Enforces X-Admin-Token header check with fallback to 'admin123' for hackathon evaluation.
 */

function requireAdminToken(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.admin_token;
  const expectedToken = process.env.ADMIN_TOKEN || 'admin123';

  if (!token || token !== expectedToken) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid or missing X-Admin-Token header'
    });
  }

  next();
}

module.exports = {
  requireAdminToken
};
