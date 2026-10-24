// ============================================================
// JSON Database Utility
// Handles reading, writing, validation, and error handling
// for all JSON file-based database operations
// ============================================================

const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', '..', 'database');

// Write queue to serialize concurrent writes per file
const writeQueues = {};

/**
 * Ensure the database directory exists
 */
function ensureDbDirectory() {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
}

/**
 * Get the full path to a database JSON file
 */
function getDbPath(filename) {
    return path.join(DB_DIR, filename);
}

/**
 * Initialize a database file with default data if it doesn't exist
 */
function initializeFile(filename, defaultData = []) {
    ensureDbDirectory();
    const filePath = getDbPath(filename);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
    }
}

/**
 * Read data from a JSON database file
 */
function readData(filename) {
    const filePath = getDbPath(filename);
    try {
        if (!fs.existsSync(filePath)) {
            initializeFile(filename, filename === 'settings.json' ? {} : []);
            return filename === 'settings.json' ? {} : [];
        }
        const raw = fs.readFileSync(filePath, 'utf8');
        if (!raw.trim()) {
            return filename === 'settings.json' ? {} : [];
        }
        return JSON.parse(raw);
    } catch (err) {
        console.error(`Error reading ${filename}:`, err.message);
        if (err instanceof SyntaxError) {
            // Backup corrupt file and reinitialize
            const backupPath = filePath + '.backup.' + Date.now();
            try {
                fs.copyFileSync(filePath, backupPath);
                console.log(`Backed up corrupt file to ${backupPath}`);
            } catch (e) {
                // ignore backup failure
            }
            const defaultData = filename === 'settings.json' ? {} : [];
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
            return defaultData;
        }
        throw err;
    }
}

/**
 * Write data to a JSON database file using atomic replacement
 * Serialized with a per-file write queue to prevent conflicts
 */
async function writeData(filename, data) {
    return new Promise((resolve, reject) => {
        if (!writeQueues[filename]) {
            writeQueues[filename] = Promise.resolve();
        }

        writeQueues[filename] = writeQueues[filename].then(() => {
            return new Promise((res, rej) => {
                const filePath = getDbPath(filename);
                const tempPath = filePath + '.tmp.' + Date.now();
                try {
                    ensureDbDirectory();
                    const jsonStr = JSON.stringify(data, null, 2);
                    // Write to temp file first (atomic replacement)
                    fs.writeFileSync(tempPath, jsonStr, 'utf8');
                    // Rename temp to actual (atomic on most systems)
                    fs.renameSync(tempPath, filePath);
                    resolve();
                    res();
                } catch (err) {
                    // Clean up temp file if it exists
                    try { fs.unlinkSync(tempPath); } catch(e) {}
                    console.error(`Error writing ${filename}:`, err.message);
                    reject(err);
                    rej(err);
                }
            });
        }).catch(err => {
            // Don't let queue chain break on errors
            console.error(`Write queue error for ${filename}:`, err.message);
        });
    });
}

/**
 * Find a record by ID
 */
function findById(data, id) {
    return data.find(item => item.id === id);
}

/**
 * Find a record by a specific field value
 */
function findByField(data, field, value) {
    return data.find(item => item[field] === value);
}

/**
 * Filter records by a specific field value
 */
function filterByField(data, field, value) {
    return data.filter(item => item[field] === value);
}

/**
 * Initialize all database files
 */
function initializeAllDatabases() {
    ensureDbDirectory();
    initializeFile('users.json', []);
    initializeFile('services.json', []);
    initializeFile('reservations.json', []);
    initializeFile('payments.json', []);
    initializeFile('settings.json', {
        applicationName: 'ReserveEase',
        currency: 'INR',
        currencySymbol: '₹',
        cancellationPolicy: 'Reservations can be cancelled up to 24 hours before the scheduled time. Late cancellations may be subject to charges.',
        contactEmail: 'support@reserveease.com',
        contactPhone: '+91 98765 43210',
        enabledPaymentMethods: ['Cash', 'Card', 'UPI'],
        bookingTimeRestrictions: {
            minAdvanceHours: 2,
            maxAdvanceDays: 30
        },
        defaultBookingStatus: 'Pending',
        updatedAt: new Date().toISOString()
    });
}

module.exports = {
    readData,
    writeData,
    findById,
    findByField,
    filterByField,
    initializeAllDatabases,
    getDbPath,
    DB_DIR
};
