// ============================================================
// Authentication Middleware
// Checks if user is logged in and attaches user to request
// ============================================================

const { readData, findById } = require('../utils/jsonDatabase');

/**
 * Require authentication - redirects to login if not authenticated
 */
function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Please log in to access this resource'
        });
    }

    // Load user from database
    const users = readData('users.json');
    const user = findById(users, req.session.userId);

    if (!user) {
        req.session.destroy();
        return res.status(401).json({
            success: false,
            message: 'Session invalid. Please log in again.'
        });
    }

    if (!user.isActive) {
        req.session.destroy();
        return res.status(403).json({
            success: false,
            message: 'Your account has been deactivated. Contact the administrator.'
        });
    }

    // Attach user to request (without password hash)
    req.user = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
    };

    next();
}

/**
 * Optional authentication - attaches user if logged in, but doesn't require it
 */
function optionalAuth(req, res, next) {
    if (req.session && req.session.userId) {
        const users = readData('users.json');
        const user = findById(users, req.session.userId);
        if (user && user.isActive) {
            req.user = {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.createdAt
            };
        }
    }
    next();
}

module.exports = { requireAuth, optionalAuth };
