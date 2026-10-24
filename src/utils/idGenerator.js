// ============================================================
// ID Generator Utility
// Generates unique IDs for records and booking references
// ============================================================

const { v4: uuidv4 } = require('uuid');

/**
 * Generate a UUID
 */
function generateId() {
    return uuidv4();
}

/**
 * Generate a booking ID like RES-2026-0001
 * @param {Array} existingReservations - existing reservations to determine next number
 */
function generateBookingId(existingReservations) {
    const year = new Date().getFullYear();
    const prefix = `RES-${year}-`;
    
    // Find the highest number for this year
    let maxNum = 0;
    existingReservations.forEach(res => {
        if (res.bookingId && res.bookingId.startsWith(prefix)) {
            const num = parseInt(res.bookingId.replace(prefix, ''), 10);
            if (!isNaN(num) && num > maxNum) {
                maxNum = num;
            }
        }
    });
    
    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

/**
 * Generate a payment reference like PAY-2026-0001
 * @param {Array} existingPayments - existing payments to determine next number
 */
function generatePaymentReference(existingPayments) {
    const year = new Date().getFullYear();
    const prefix = `PAY-${year}-`;
    
    let maxNum = 0;
    existingPayments.forEach(pay => {
        if (pay.paymentReference && pay.paymentReference.startsWith(prefix)) {
            const num = parseInt(pay.paymentReference.replace(prefix, ''), 10);
            if (!isNaN(num) && num > maxNum) {
                maxNum = num;
            }
        }
    });
    
    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

module.exports = {
    generateId,
    generateBookingId,
    generatePaymentReference
};
