// ============================================================
// Admin Authorization Middleware
// Ensures only admin users can access admin routes
// ============================================================

/**
 * Require admin role - must be used after requireAuth
 */
function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Administrator privileges required.'
        });
    }

    next();
}

module.exports = { requireAdmin };
