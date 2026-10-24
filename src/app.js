// ============================================================
// Express Application Setup
// ============================================================

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const { configureSession } = require('./config/session');
const { initializeAllDatabases } = require('./utils/jsonDatabase');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const customerRoutes = require('./routes/customerRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const adminRoutes = require('./routes/adminRoutes');

function createApp() {
    const app = express();

    // Initialize database files
    initializeAllDatabases();

    // Security middleware
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "http://localhost:3000", "http://localhost:3030"]
            }
        }
    }));

    app.use(cors({
        origin: true,
        credentials: true
    }));

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Session
    configureSession(app);

    // Prevent access to database directory
    app.use('/database', (req, res) => {
        res.status(403).json({ success: false, message: 'Access denied' });
    });

    // Dual-Port Root Redirect: Port 3000 lands on Admin, Port 3030 lands on Customer
    app.get('/', (req, res, next) => {
        const host = req.headers.host || '';
        if (host.includes(':3000')) {
            return res.redirect('/admin/dashboard.html');
        }
        next();
    });

    // Admin redirect
    app.get('/admin', (req, res) => {
        res.redirect('/admin/dashboard.html');
    });

    // Static files
    app.use(express.static(path.join(__dirname, '..', 'public')));

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/services', serviceRoutes);
    app.use('/api/reservations', reservationRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/customer', customerRoutes);
    app.use('/api/settings', settingsRoutes);

    // Admin API Routes
    app.use('/api/admin', adminRoutes);

    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

module.exports = createApp;
