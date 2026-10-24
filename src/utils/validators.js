// ============================================================
// Validators Utility
// Common validation functions used across the application
// ============================================================

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate Indian mobile number format (10 digits, starts with 6-9)
 */
function isValidPhone(phone) {
    if (!phone) return false;
    const cleaned = String(phone).trim().replace(/^(\+91|91)/, '').replace(/[\s\-]/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(cleaned);
}

/**
 * Validate password strength (min 6 chars, at least 1 letter and 1 number)
 */
function isValidPassword(password) {
    if (password.length < 6) return false;
    if (!/[a-zA-Z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
}

/**
 * Validate a date string (YYYY-MM-DD)
 */
function isValidDate(dateStr) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
}

/**
 * Check if a date is in the past
 */
function isPastDate(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    return date < today;
}

/**
 * Validate a time slot format (HH:MM)
 */
function isValidTimeSlot(timeSlot) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(timeSlot);
}

/**
 * Sanitize a string input (basic XSS prevention)
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>]/g, '').trim();
}

/**
 * Validate positive number
 */
function isPositiveNumber(num) {
    return typeof num === 'number' && num > 0 && isFinite(num);
}

/**
 * Validate positive integer
 */
function isPositiveInteger(num) {
    return Number.isInteger(num) && num > 0;
}

module.exports = {
    isValidEmail,
    isValidPhone,
    isValidPassword,
    isValidDate,
    isPastDate,
    isValidTimeSlot,
    sanitizeString,
    isPositiveNumber,
    isPositiveInteger
};
