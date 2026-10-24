// ============================================================
// Server Entry Point
// Dual-Port Setup: Admin on Port 3000 & Customer on Port 3030
// ============================================================

const http = require('http');
require('dotenv').config();

const createApp = require('./src/app');

const app = createApp();

const ADMIN_PORT = parseInt(process.env.ADMIN_PORT || '3000', 10);
const CUSTOMER_PORT = parseInt(process.env.CUSTOMER_PORT || process.env.PORT || '3030', 10);

// Customer Portal Server (Port 3030)
const customerServer = http.createServer(app);
customerServer.listen(CUSTOMER_PORT, () => {
    console.log(`👤 Customer Portal: http://localhost:${CUSTOMER_PORT}`);
});

// Admin Portal Server (Port 3000)
const adminServer = http.createServer(app);
adminServer.listen(ADMIN_PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                                                              ║');
    console.log('║        🎯  ReserveEase - Dual-Port Reservation System        ║');
    console.log('║                                                              ║');
    console.log(`║   🛡️  ADMIN PORT (3000):    http://localhost:${ADMIN_PORT}            ║`);
    console.log(`║   👤  CUSTOMER PORT (3030): http://localhost:${CUSTOMER_PORT}            ║`);
    console.log('║                                                              ║');
    console.log('║   Admin Login:     admin@reservations.com / Admin@123        ║');
    console.log('║   Database:        ./database/ (Local JSON Database)         ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
});

// Handle graceful shutdown
function handleShutdown() {
    customerServer.close();
    adminServer.close();
}

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);
