// ============================================================
// Payment Routes
// Customer: POST /api/payments, GET /my, GET /:id
// Admin: GET /api/admin/payments, PATCH /admin/:id/status
// ============================================================

const express = require('express');
const router = express.Router();
const { readData, writeData, findById } = require('../utils/jsonDatabase');
const { generateId, generatePaymentReference } = require('../utils/idGenerator');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// POST /api/payments - Process demo payment
router.post('/', requireAuth, async (req, res) => {
    try {
        const { reservationId, paymentMethod } = req.body;

        if (!reservationId || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'Reservation ID and payment method are required' });
        }

        const validMethods = ['Cash', 'Card', 'UPI'];
        if (!validMethods.includes(paymentMethod)) {
            return res.status(400).json({ success: false, message: 'Invalid payment method' });
        }

        // Get reservation
        const reservations = readData('reservations.json');
        const reservation = findById(reservations, reservationId);

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        // Only own reservations
        if (reservation.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (reservation.paymentStatus === 'Paid') {
            return res.status(400).json({ success: false, message: 'Payment already completed for this reservation' });
        }

        if (reservation.reservationStatus === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Cannot pay for a cancelled reservation' });
        }

        // Check for existing pending payment
        const payments = readData('payments.json');
        const existingPayment = payments.find(p =>
            p.reservationId === reservationId &&
            p.paymentStatus === 'Paid'
        );

        if (existingPayment) {
            return res.status(400).json({ success: false, message: 'Payment already exists for this reservation' });
        }

        const paymentRef = generatePaymentReference(payments);

        const newPayment = {
            id: generateId(),
            paymentReference: paymentRef,
            reservationId,
            userId: req.user.id,
            amount: reservation.totalAmount,
            paymentMethod,
            paymentStatus: 'Paid',
            isDemoTransaction: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        payments.push(newPayment);
        await writeData('payments.json', payments);

        // Update reservation payment status
        const resIndex = reservations.findIndex(r => r.id === reservationId);
        reservations[resIndex].paymentStatus = 'Paid';
        reservations[resIndex].updatedAt = new Date().toISOString();
        await writeData('reservations.json', reservations);

        res.status(201).json({
            success: true,
            message: 'Demo payment processed successfully! (No real money was charged)',
            payment: newPayment
        });
    } catch (err) {
        console.error('Error processing payment:', err);
        res.status(500).json({ success: false, message: 'Payment processing failed' });
    }
});

// GET /api/payments/my - Customer: get own payments
router.get('/my', requireAuth, (req, res) => {
    try {
        const payments = readData('payments.json');
        const reservations = readData('reservations.json');
        const services = readData('services.json');

        const myPayments = payments
            .filter(p => p.userId === req.user.id)
            .map(p => {
                const reservation = findById(reservations, p.reservationId);
                const service = reservation ? findById(services, reservation.serviceId) : null;
                return {
                    ...p,
                    bookingId: reservation ? reservation.bookingId : 'N/A',
                    serviceName: service ? service.name : 'Unknown',
                    reservationDate: reservation ? reservation.reservationDate : '',
                    timeSlot: reservation ? reservation.timeSlot : ''
                };
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ success: true, payments: myPayments });
    } catch (err) {
        console.error('Error fetching payments:', err);
        res.status(500).json({ success: false, message: 'Failed to load payments' });
    }
});

// GET /api/payments/:id - Get payment details
router.get('/:id', requireAuth, (req, res) => {
    try {
        const payments = readData('payments.json');
        const payment = findById(payments, req.params.id);

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        if (req.user.role !== 'admin' && payment.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const reservations = readData('reservations.json');
        const reservation = findById(reservations, payment.reservationId);
        const services = readData('services.json');
        const service = reservation ? findById(services, reservation.serviceId) : null;

        res.json({
            success: true,
            payment: {
                ...payment,
                bookingId: reservation ? reservation.bookingId : 'N/A',
                serviceName: service ? service.name : 'Unknown',
                reservationDate: reservation ? reservation.reservationDate : '',
                timeSlot: reservation ? reservation.timeSlot : '',
                quantity: reservation ? reservation.quantity : 0
            }
        });
    } catch (err) {
        console.error('Error fetching payment:', err);
        res.status(500).json({ success: false, message: 'Failed to load payment' });
    }
});

// ==================== ADMIN ROUTES ====================

// GET /api/admin/payments - Admin: all payments
router.get('/admin/all', requireAuth, requireAdmin, (req, res) => {
    try {
        const payments = readData('payments.json');
        const reservations = readData('reservations.json');
        const services = readData('services.json');
        const users = readData('users.json');

        let allPayments = payments.map(p => {
            const reservation = findById(reservations, p.reservationId);
            const service = reservation ? findById(services, reservation.serviceId) : null;
            const user = findById(users, p.userId);
            return {
                ...p,
                bookingId: reservation ? reservation.bookingId : 'N/A',
                serviceName: service ? service.name : 'Unknown',
                customerName: user ? user.fullName : 'Unknown',
                customerEmail: user ? user.email : ''
            };
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Filters
        const { status, method, search } = req.query;
        if (status && status !== 'all') {
            allPayments = allPayments.filter(p => p.paymentStatus === status);
        }
        if (method && method !== 'all') {
            allPayments = allPayments.filter(p => p.paymentMethod === method);
        }
        if (search) {
            const q = search.toLowerCase();
            allPayments = allPayments.filter(p =>
                p.paymentReference.toLowerCase().includes(q) ||
                p.bookingId.toLowerCase().includes(q) ||
                p.customerName.toLowerCase().includes(q)
            );
        }

        res.json({ success: true, payments: allPayments });
    } catch (err) {
        console.error('Error fetching admin payments:', err);
        res.status(500).json({ success: false, message: 'Failed to load payments' });
    }
});

// PATCH /api/admin/payments/:id/status - Admin: update payment status
router.patch('/admin/:id/status', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { status, reason } = req.body;
        const validStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid payment status' });
        }

        const payments = readData('payments.json');
        const index = payments.findIndex(p => p.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        payments[index].paymentStatus = status;
        payments[index].statusChangeReason = reason || '';
        payments[index].updatedAt = new Date().toISOString();

        await writeData('payments.json', payments);

        // Also update reservation payment status
        const reservations = readData('reservations.json');
        const resIndex = reservations.findIndex(r => r.id === payments[index].reservationId);
        if (resIndex !== -1) {
            reservations[resIndex].paymentStatus = status;
            reservations[resIndex].updatedAt = new Date().toISOString();
            await writeData('reservations.json', reservations);
        }

        res.json({
            success: true,
            message: `Payment status updated to ${status}`,
            payment: payments[index]
        });
    } catch (err) {
        console.error('Error updating payment status:', err);
        res.status(500).json({ success: false, message: 'Failed to update payment status' });
    }
});

module.exports = router;
