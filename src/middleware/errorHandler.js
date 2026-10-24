// ============================================================
// Error Handler Middleware
// Centralized error handling for the application
// ============================================================

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res, next) {
    // Only handle API routes - let static files pass through
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
    next();
}

/**
 * Global error handler
 */
function errorHandler(err, req, res, next) {
    console.error('Server Error:', err.message);
    
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    // Don't expose stack traces in production
    const response = {
        success: false,
        message: 'Internal server error'
    };

    if (process.env.NODE_ENV === 'development') {
        response.error = err.message;
    }

    res.status(err.status || 500).json(response);
}

module.exports = { notFoundHandler, errorHandler };
