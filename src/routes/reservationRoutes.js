// ============================================================
// Reservation Routes
// Customer: POST, GET /my, GET/:id, PUT/:id, PATCH/:id/cancel
// Admin: GET /admin, GET /admin/:id, PATCH /admin/:id/status
// ============================================================

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { readData, writeData, findById } = require('../utils/jsonDatabase');
const { generateId, generateBookingId } = require('../utils/idGenerator');
const { sanitizeString, isValidDate, isPastDate, isValidTimeSlot, isPositiveInteger } = require('../utils/validators');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

/**
 * Check availability for a service on a given date/time/quantity
 */
function checkAvailability(serviceId, date, timeSlot, quantity, excludeReservationId = null) {
    const services = readData('services.json');
    const service = findById(services, serviceId);

    if (!service || !service.isActive) {
        return { available: false, reason: 'Service not found or inactive' };
    }

    // Check if date is available
    if (service.availableDates && service.availableDates.length > 0) {
        if (!service.availableDates.includes(date)) {
            return { available: false, reason: 'Service is not available on this date' };
        }
    }

    // Check if time slot is valid
    if (service.timeSlots && service.timeSlots.length > 0) {
        if (!service.timeSlots.includes(timeSlot)) {
            return { available: false, reason: 'Selected time slot is not available' };
        }
    }

    // Check capacity
    const reservations = readData('reservations.json');
    const existingBookings = reservations.filter(r =>
        r.serviceId === serviceId &&
        r.reservationDate === date &&
        r.timeSlot === timeSlot &&
        ['Pending', 'Confirmed'].includes(r.reservationStatus) &&
        r.id !== excludeReservationId
    );

    const bookedQuantity = existingBookings.reduce((sum, r) => sum + r.quantity, 0);
    const availableCapacity = service.capacity - bookedQuantity;

    if (quantity > availableCapacity) {
        return {
            available: false,
            reason: `Only ${availableCapacity} spot(s) available for this time slot`,
            availableCapacity
        };
    }

    return { available: true, availableCapacity, service };
}

// POST /api/reservations - Customer: create reservation
router.post('/', requireAuth, [
    body('serviceId').notEmpty().withMessage('Service is required'),
    body('reservationDate').notEmpty().withMessage('Reservation date is required'),
    body('timeSlot').notEmpty().withMessage('Time slot is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { serviceId, reservationDate, timeSlot, quantity, specialInstructions } = req.body;
        const qty = parseInt(quantity);

        // Validate date
        if (!isValidDate(reservationDate)) {
            return res.status(400).json({ success: false, message: 'Invalid date format' });
        }

        if (isPastDate(reservationDate)) {
            return res.status(400).json({ success: false, message: 'Cannot book for a past date' });
        }

        // Validate time slot
        if (!isValidTimeSlot(timeSlot)) {
            return res.status(400).json({ success: false, message: 'Invalid time slot format' });
        }

        // Check availability
        const availCheck = checkAvailability(serviceId, reservationDate, timeSlot, qty);
        if (!availCheck.available) {
            return res.status(400).json({ success: false, message: availCheck.reason });
        }

        const service = availCheck.service;

        // Calculate total on server side
        const unitPrice = service.price;
        const totalAmount = unitPrice * qty;

        const reservations = readData('reservations.json');
        const bookingId = generateBookingId(reservations);

        const newReservation = {
            id: generateId(),
            bookingId,
            userId: req.user.id,
            serviceId,
            reservationDate,
            timeSlot,
            quantity: qty,
            unitPrice,
            totalAmount,
            specialInstructions: specialInstructions ? sanitizeString(specialInstructions) : '',
            reservationStatus: 'Pending',
            paymentStatus: 'Pending',
            cancellationReason: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        reservations.push(newReservation);
        await writeData('reservations.json', reservations);

        res.status(201).json({
            success: true,
            message: 'Reservation created successfully!',
            reservation: {
                ...newReservation,
                serviceName: service.name
            }
        });
    } catch (err) {
        console.error('Error creating reservation:', err);
        res.status(500).json({ success: false, message: 'Failed to create reservation' });
    }
});

// GET /api/reservations/my - Customer: get own reservations
router.get('/my', requireAuth, (req, res) => {
    try {
        const reservations = readData('reservations.json');
        const services = readData('services.json');

        let myReservations = reservations
            .filter(r => r.userId === req.user.id)
            .map(r => {
                const service = findById(services, r.serviceId);
                return {
                    ...r,
                    serviceName: service ? service.name : 'Unknown Service',
                    serviceCategory: service ? service.category : ''
                };
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Apply filters
        const { status, search, dateFrom, dateTo } = req.query;

        if (status && status !== 'all') {
            myReservations = myReservations.filter(r => r.reservationStatus === status);
        }
        if (search) {
            const q = search.toLowerCase();
            myReservations = myReservations.filter(r =>
                r.bookingId.toLowerCase().includes(q) ||
                r.serviceName.toLowerCase().includes(q)
            );
        }
        if (dateFrom) {
            myReservations = myReservations.filter(r => r.reservationDate >= dateFrom);
        }
        if (dateTo) {
            myReservations = myReservations.filter(r => r.reservationDate <= dateTo);
        }

        res.json({ success: true, reservations: myReservations });
    } catch (err) {
        console.error('Error fetching reservations:', err);
        res.status(500).json({ success: false, message: 'Failed to load reservations' });
    }
});

// GET /api/reservations/:id - Customer: get reservation details
router.get('/:id', requireAuth, (req, res) => {
    try {
        const reservations = readData('reservations.json');
        const reservation = findById(reservations, req.params.id);

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        // Ensure customer can only see own reservations (admin can see all)
        if (req.user.role !== 'admin' && reservation.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const services = readData('services.json');
        const service = findById(services, reservation.serviceId);
        const users = readData('users.json');
        const user = findById(users, reservation.userId);
        const payments = readData('payments.json');
        const payment = payments.find(p => p.reservationId === reservation.id);

        res.json({
            success: true,
            reservation: {
                ...reservation,
                serviceName: service ? service.name : 'Unknown',
                serviceCategory: service ? service.category : '',
                customerName: user ? user.fullName : 'Unknown',
                customerEmail: user ? user.email : '',
                customerPhone: user ? user.phone : '',
                payment: payment || null
            }
        });
    } catch (err) {
        console.error('Error fetching reservation:', err);
        res.status(500).json({ success: false, message: 'Failed to load reservation' });
    }
});

// PUT /api/reservations/:id - Customer: modify reservation
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const reservations = readData('reservations.json');
        const index = reservations.findIndex(r => r.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        const reservation = reservations[index];

        // Only own reservations
        if (reservation.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Only Pending reservations can be modified
        if (reservation.reservationStatus !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot modify a ${reservation.reservationStatus.toLowerCase()} reservation`
            });
        }

        const { reservationDate, timeSlot, quantity, specialInstructions } = req.body;
        const newDate = reservationDate || reservation.reservationDate;
        const newSlot = timeSlot || reservation.timeSlot;
        const newQty = quantity ? parseInt(quantity) : reservation.quantity;

        if (reservationDate && !isValidDate(reservationDate)) {
            return res.status(400).json({ success: false, message: 'Invalid date format' });
        }
        if (reservationDate && isPastDate(reservationDate)) {
            return res.status(400).json({ success: false, message: 'Cannot book for a past date' });
        }

        // Recheck availability
        const availCheck = checkAvailability(reservation.serviceId, newDate, newSlot, newQty, reservation.id);
        if (!availCheck.available) {
            return res.status(400).json({ success: false, message: availCheck.reason });
        }

        // Recalculate total on server
        const totalAmount = availCheck.service.price * newQty;

        reservations[index].reservationDate = newDate;
        reservations[index].timeSlot = newSlot;
        reservations[index].quantity = newQty;
        reservations[index].unitPrice = availCheck.service.price;
        reservations[index].totalAmount = totalAmount;
        if (specialInstructions !== undefined) {
            reservations[index].specialInstructions = sanitizeString(specialInstructions);
        }
        reservations[index].updatedAt = new Date().toISOString();

        await writeData('reservations.json', reservations);

        res.json({
            success: true,
            message: 'Reservation updated successfully',
            reservation: reservations[index]
        });
    } catch (err) {
        console.error('Error updating reservation:', err);
        res.status(500).json({ success: false, message: 'Failed to update reservation' });
    }
});

// PATCH /api/reservations/:id/cancel - Customer: cancel reservation
router.patch('/:id/cancel', requireAuth, async (req, res) => {
    try {
        const reservations = readData('reservations.json');
        const index = reservations.findIndex(r => r.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        const reservation = reservations[index];

        // Only own reservations
        if (req.user.role !== 'admin' && reservation.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Only Pending or Confirmed can be cancelled
        if (!['Pending', 'Confirmed'].includes(reservation.reservationStatus)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel a ${reservation.reservationStatus.toLowerCase()} reservation`
            });
        }

        reservations[index].reservationStatus = 'Cancelled';
        reservations[index].cancellationReason = req.body.reason ? sanitizeString(req.body.reason) : 'Cancelled by customer';
        reservations[index].updatedAt = new Date().toISOString();

        // If payment was made, mark for refund
        const payments = readData('payments.json');
        const payIndex = payments.findIndex(p => p.reservationId === reservation.id && p.paymentStatus === 'Paid');
        if (payIndex !== -1) {
            payments[payIndex].paymentStatus = 'Refunded';
            payments[payIndex].updatedAt = new Date().toISOString();
            await writeData('payments.json', payments);
            reservations[index].paymentStatus = 'Refunded';
        }

        await writeData('reservations.json', reservations);

        res.json({
            success: true,
            message: 'Reservation cancelled successfully'
        });
    } catch (err) {
        console.error('Error cancelling reservation:', err);
        res.status(500).json({ success: false, message: 'Failed to cancel reservation' });
    }
});

// ==================== ADMIN ROUTES ====================

// GET /api/admin/reservations - Admin: all reservations
router.get('/admin/all', requireAuth, requireAdmin, (req, res) => {
    try {
        const reservations = readData('reservations.json');
        const services = readData('services.json');
        const users = readData('users.json');

        let allReservations = reservations.map(r => {
            const service = findById(services, r.serviceId);
            const user = findById(users, r.userId);
            return {
                ...r,
                serviceName: service ? service.name : 'Unknown',
                serviceCategory: service ? service.category : '',
                customerName: user ? user.fullName : 'Unknown',
                customerEmail: user ? user.email : ''
            };
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Filters
        const { status, paymentStatus, search, dateFrom, dateTo, serviceId } = req.query;

        if (status && status !== 'all') {
            allReservations = allReservations.filter(r => r.reservationStatus === status);
        }
        if (paymentStatus && paymentStatus !== 'all') {
            allReservations = allReservations.filter(r => r.paymentStatus === paymentStatus);
        }
        if (search) {
            const q = search.toLowerCase();
            allReservations = allReservations.filter(r =>
                r.bookingId.toLowerCase().includes(q) ||
                r.customerName.toLowerCase().includes(q) ||
                r.customerEmail.toLowerCase().includes(q)
            );
        }
        if (dateFrom) {
            allReservations = allReservations.filter(r => r.reservationDate >= dateFrom);
        }
        if (dateTo) {
            allReservations = allReservations.filter(r => r.reservationDate <= dateTo);
        }
        if (serviceId && serviceId !== 'all') {
            allReservations = allReservations.filter(r => r.serviceId === serviceId);
        }

        res.json({ success: true, reservations: allReservations });
    } catch (err) {
        console.error('Error fetching admin reservations:', err);
        res.status(500).json({ success: false, message: 'Failed to load reservations' });
    }
});

// GET /api/admin/reservations/:id - Admin: get reservation details
router.get('/admin/:id', requireAuth, requireAdmin, (req, res) => {
    try {
        const reservations = readData('reservations.json');
        const reservation = findById(reservations, req.params.id);

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        const services = readData('services.json');
        const service = findById(services, reservation.serviceId);
        const users = readData('users.json');
        const user = findById(users, reservation.userId);
        const payments = readData('payments.json');
        const payment = payments.find(p => p.reservationId === reservation.id);

        res.json({
            success: true,
            reservation: {
                ...reservation,
                serviceName: service ? service.name : 'Unknown',
                serviceCategory: service ? service.category : '',
                customerName: user ? user.fullName : 'Unknown',
                customerEmail: user ? user.email : '',
                customerPhone: user ? user.phone : '',
                payment: payment || null
            }
        });
    } catch (err) {
        console.error('Error fetching reservation details:', err);
        res.status(500).json({ success: false, message: 'Failed to load reservation' });
    }
});

// PATCH /api/admin/reservations/:id/status - Admin: update reservation status
router.patch('/admin/:id/status', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { status, reason } = req.body;
        const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const reservations = readData('reservations.json');
        const index = reservations.findIndex(r => r.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        reservations[index].reservationStatus = status;
        if (status === 'Cancelled' && reason) {
            reservations[index].cancellationReason = sanitizeString(reason);
        }
        reservations[index].updatedAt = new Date().toISOString();

        await writeData('reservations.json', reservations);

        res.json({
            success: true,
            message: `Reservation status updated to ${status}`,
            reservation: reservations[index]
        });
    } catch (err) {
        console.error('Error updating reservation status:', err);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
});

// GET /api/reservations/availability/check - Check availability
router.get('/availability/check', (req, res) => {
    try {
        const { serviceId, date, timeSlot } = req.query;
        if (!serviceId || !date) {
            return res.status(400).json({ success: false, message: 'Service and date are required' });
        }

        const services = readData('services.json');
        const service = findById(services, serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        const reservations = readData('reservations.json');

        // Get booked slots for this service/date
        const bookedSlots = {};
        reservations
            .filter(r =>
                r.serviceId === serviceId &&
                r.reservationDate === date &&
                ['Pending', 'Confirmed'].includes(r.reservationStatus)
            )
            .forEach(r => {
                bookedSlots[r.timeSlot] = (bookedSlots[r.timeSlot] || 0) + r.quantity;
            });

        const slotsAvailability = (service.timeSlots || []).map(slot => ({
            time: slot,
            booked: bookedSlots[slot] || 0,
            available: service.capacity - (bookedSlots[slot] || 0),
            isFull: (bookedSlots[slot] || 0) >= service.capacity
        }));

        res.json({
            success: true,
            service: { id: service.id, name: service.name, capacity: service.capacity },
            date,
            slots: slotsAvailability
        });
    } catch (err) {
        console.error('Error checking availability:', err);
        res.status(500).json({ success: false, message: 'Failed to check availability' });
    }
});

module.exports = router;
