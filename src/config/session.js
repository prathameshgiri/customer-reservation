// ============================================================
// Session Configuration
// Supports dual-port setup: Admin on 3000, Customer on 3030
// Isolated cookies prevent session overwrites in same browser
// ============================================================

const session = require('express-session');

const sessionSecret = process.env.SESSION_SECRET || 'reserve_ease_super_secret_session_key_2026';

const adminSession = session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: 'reserveease_admin.sid',
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
});

const customerSession = session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: 'reserveease_customer.sid',
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
});

function configureSession(app) {
    app.use((req, res, next) => {
        const host = req.headers.host || '';
        if (host.includes(':3000')) {
            return adminSession(req, res, next);
        }
        return customerSession(req, res, next);
    });
}

module.exports = { configureSession };
