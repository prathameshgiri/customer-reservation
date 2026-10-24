// ============================================================
// ReserveEase - Dedicated Admin Routes
// Cleanly mounted at /api/admin
// Eliminates route rewriting collisions and handles all admin operations
// ============================================================

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { readData, writeData, findById } = require('../utils/jsonDatabase');
const { generateId } = require('../utils/idGenerator');
const { sanitizeString } = require('../utils/validators');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// All admin routes require authentication and admin role
router.use(requireAuth, requireAdmin);

// ============================================================
// 1. ADMIN DASHBOARD
// GET /api/admin/dashboard
// ============================================================
router.get('/dashboard', (req, res) => {
    try {
        const users = readData('users.json');
        const reservations = readData('reservations.json');
        const payments = readData('payments.json');
        const services = readData('services.json');

        const today = new Date().toISOString().split('T')[0];
        const customers = users.filter(u => u.role === 'customer');

        const stats = {
            totalCustomers: customers.length,
            activeCustomers: customers.filter(c => c.isActive).length,
            totalServices: services.filter(s => s.isActive).length,
            totalReservations: reservations.length,
            todaysReservations: reservations.filter(r => r.reservationDate === today).length,
            upcomingReservations: reservations.filter(r =>
                r.reservationDate >= today &&
                ['Pending', 'Confirmed'].includes(r.reservationStatus)
            ).length,
            pendingReservations: reservations.filter(r => r.reservationStatus === 'Pending').length,
            confirmedReservations: reservations.filter(r => r.reservationStatus === 'Confirmed').length,
            completedReservations: reservations.filter(r => r.reservationStatus === 'Completed').length,
            cancelledReservations: reservations.filter(r => r.reservationStatus === 'Cancelled').length,
            totalPayments: payments.length,
            totalRevenue: payments
                .filter(p => p.paymentStatus === 'Paid')
                .reduce((sum, p) => sum + (p.amount || 0), 0),
            pendingPayments: payments.filter(p => p.paymentStatus === 'Pending').length
        };

        // Monthly trends (last 6 months)
        const monthlyTrends = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const month = d.toISOString().slice(0, 7);
            const monthName = d.toLocaleString('default', { month: 'short', year: 'numeric' });
            const monthReservations = reservations.filter(r => r.createdAt && r.createdAt.startsWith(month));
            const monthRevenue = payments
                .filter(p => p.paymentStatus === 'Paid' && p.createdAt && p.createdAt.startsWith(month))
                .reduce((sum, p) => sum + (p.amount || 0), 0);
            monthlyTrends.push({
                month: monthName,
                bookings: monthReservations.length,
                revenue: monthRevenue
            });
        }

        const bookingsByStatus = {
            Pending: stats.pendingReservations,
            Confirmed: stats.confirmedReservations,
            Completed: stats.completedReservations,
            Cancelled: stats.cancelledReservations
        };

        const recentReservations = reservations
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10)
            .map(r => {
                const service = findById(services, r.serviceId);
                const user = findById(users, r.userId);
                return {
                    bookingId: r.bookingId,
                    customerName: user ? user.fullName : 'Customer',
                    serviceName: service ? service.name : 'Service',
                    reservationDate: r.reservationDate,
                    totalAmount: r.totalAmount,
                    reservationStatus: r.reservationStatus,
                    paymentStatus: r.paymentStatus,
                    id: r.id
                };
            });

        res.json({
            success: true,
            stats,
            monthlyTrends,
            bookingsByStatus,
            recentReservations
        });
    } catch (err) {
        console.error('Error fetching admin dashboard:', err);
        res.status(500).json({ success: false, message: 'Failed to load dashboard' });
    }
});

// ============================================================
// 2. ADMIN RESERVATIONS
// GET /api/admin/reservations
// GET /api/admin/reservations/:id
// PATCH /api/admin/reservations/:id/status
// ============================================================
router.get('/reservations', (req, res) => {
    try {
        const reservations = readData('reservations.json');
        const services = readData('services.json');
        const users = readData('users.json');

        let allReservations = reservations.map(r => {
            const service = findById(services, r.serviceId);
            const user = findById(users, r.userId);
            return {
                ...r,
                serviceName: service ? service.name : 'Unknown Service',
                serviceCategory: service ? service.category : '',
                customerName: user ? user.fullName : 'Unknown Customer',
                customerEmail: user ? user.email : '',
                customerPhone: user ? user.phone : ''
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
                (r.bookingId && r.bookingId.toLowerCase().includes(q)) ||
                (r.customerName && r.customerName.toLowerCase().includes(q)) ||
                (r.customerEmail && r.customerEmail.toLowerCase().includes(q)) ||
                (r.serviceName && r.serviceName.toLowerCase().includes(q))
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

router.get('/reservations/:id', (req, res) => {
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

router.patch('/reservations/:id/status', async (req, res) => {
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

// ============================================================
// 3. ADMIN SERVICES
// GET /api/admin/services
// GET /api/admin/services/:id
// POST /api/admin/services
// PUT /api/admin/services/:id
// DELETE /api/admin/services/:id
// ============================================================
router.get('/services', (req, res) => {
    try {
        const services = readData('services.json');
        const reservations = readData('reservations.json');
        const { search, category, status } = req.query;

        let filtered = services.map(s => {
            const serviceBookings = reservations.filter(r => r.serviceId === s.id);
            return {
                ...s,
                totalBookings: serviceBookings.length,
                activeBookings: serviceBookings.filter(r => ['Pending', 'Confirmed'].includes(r.reservationStatus)).length
            };
        });

        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(s =>
                (s.name && s.name.toLowerCase().includes(q)) ||
                (s.description && s.description.toLowerCase().includes(q)) ||
                (s.category && s.category.toLowerCase().includes(q))
            );
        }

        if (category && category !== 'all') {
            filtered = filtered.filter(s => s.category === category);
        }

        if (status === 'active') {
            filtered = filtered.filter(s => s.isActive);
        } else if (status === 'inactive') {
            filtered = filtered.filter(s => !s.isActive);
        }

        const categories = [...new Set(services.map(s => s.category))];

        res.json({ success: true, services: filtered, categories });
    } catch (err) {
        console.error('Error fetching admin services:', err);
        res.status(500).json({ success: false, message: 'Failed to load services' });
    }
});

router.get('/services/:id', (req, res) => {
    try {
        const services = readData('services.json');
        const service = findById(services, req.params.id);

        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        res.json({ success: true, service });
    } catch (err) {
        console.error('Error fetching service:', err);
        res.status(500).json({ success: false, message: 'Failed to load service' });
    }
});

router.post('/services', [
    body('name').trim().notEmpty().withMessage('Service name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { name, description, category, price, capacity, image, availableDates, timeSlots, isActive } = req.body;
        const services = readData('services.json');

        const newService = {
            id: generateId(),
            name: sanitizeString(name),
            description: sanitizeString(description),
            category: sanitizeString(category),
            price: parseFloat(price),
            image: image || '',
            capacity: parseInt(capacity, 10),
            availableDates: availableDates || [],
            timeSlots: timeSlots || ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'],
            isActive: isActive !== false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        services.push(newService);
        await writeData('services.json', services);

        res.status(201).json({
            success: true,
            message: 'Service created successfully',
            service: newService
        });
    } catch (err) {
        console.error('Error creating service:', err);
        res.status(500).json({ success: false, message: 'Failed to create service' });
    }
});

router.put('/services/:id', async (req, res) => {
    try {
        const services = readData('services.json');
        const index = services.findIndex(s => s.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        const { name, description, category, price, capacity, image, availableDates, timeSlots, isActive } = req.body;

        if (name) services[index].name = sanitizeString(name);
        if (description) services[index].description = sanitizeString(description);
        if (category) services[index].category = sanitizeString(category);
        if (price !== undefined) services[index].price = parseFloat(price);
        if (capacity !== undefined) services[index].capacity = parseInt(capacity, 10);
        if (image !== undefined) services[index].image = image;
        if (availableDates !== undefined) services[index].availableDates = availableDates;
        if (timeSlots !== undefined) services[index].timeSlots = timeSlots;
        if (isActive !== undefined) services[index].isActive = isActive;
        services[index].updatedAt = new Date().toISOString();

        await writeData('services.json', services);

        res.json({
            success: true,
            message: 'Service updated successfully',
            service: services[index]
        });
    } catch (err) {
        console.error('Error updating service:', err);
        res.status(500).json({ success: false, message: 'Failed to update service' });
    }
});

router.delete('/services/:id', async (req, res) => {
    try {
        const services = readData('services.json');
        const index = services.findIndex(s => s.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        // Check active reservations
        const reservations = readData('reservations.json');
        const hasReservations = reservations.some(r =>
            r.serviceId === req.params.id &&
            ['Pending', 'Confirmed'].includes(r.reservationStatus)
        );

        if (hasReservations) {
            services[index].isActive = false;
            services[index].updatedAt = new Date().toISOString();
            await writeData('services.json', services);

            return res.json({
                success: true,
                message: 'Service has active reservations and was deactivated instead of deleted',
                deactivated: true
            });
        }

        services.splice(index, 1);
        await writeData('services.json', services);

        res.json({
            success: true,
            message: 'Service deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting service:', err);
        res.status(500).json({ success: false, message: 'Failed to delete service' });
    }
});

// ============================================================
// 4. ADMIN CUSTOMERS
// GET /api/admin/customers
// GET /api/admin/customers/:id
// PATCH /api/admin/customers/:id/status
// ============================================================
router.get('/customers', (req, res) => {
    try {
        const users = readData('users.json');
        const reservations = readData('reservations.json');

        let customers = users
            .filter(u => u.role === 'customer')
            .map(u => ({
                id: u.id,
                fullName: u.fullName,
                email: u.email,
                phone: u.phone,
                isActive: u.isActive,
                createdAt: u.createdAt,
                totalReservations: reservations.filter(r => r.userId === u.id).length
            }));

        const { search } = req.query;
        if (search) {
            const q = search.toLowerCase();
            customers = customers.filter(c =>
                (c.fullName && c.fullName.toLowerCase().includes(q)) ||
                (c.email && c.email.toLowerCase().includes(q)) ||
                (c.phone && c.phone.includes(q))
            );
        }

        res.json({ success: true, customers });
    } catch (err) {
        console.error('Error fetching customers:', err);
        res.status(500).json({ success: false, message: 'Failed to load customers' });
    }
});

router.get('/customers/:id', (req, res) => {
    try {
        const users = readData('users.json');
        const user = findById(users, req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const reservations = readData('reservations.json');
        const services = readData('services.json');
        const payments = readData('payments.json');

        const customerReservations = reservations
            .filter(r => r.userId === user.id)
            .map(r => {
                const service = findById(services, r.serviceId);
                return {
                    ...r,
                    serviceName: service ? service.name : 'Unknown'
                };
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const customerPayments = payments.filter(p => p.userId === user.id);

        res.json({
            success: true,
            customer: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                isActive: user.isActive,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            },
            reservations: customerReservations,
            payments: customerPayments
        });
    } catch (err) {
        console.error('Error fetching customer:', err);
        res.status(500).json({ success: false, message: 'Failed to load customer' });
    }
});

router.patch('/customers/:id/status', async (req, res) => {
    try {
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ success: false, message: 'isActive must be true or false' });
        }

        const users = readData('users.json');
        const index = users.findIndex(u => u.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        if (users[index].role === 'admin') {
            return res.status(400).json({ success: false, message: 'Cannot change admin account status' });
        }

        users[index].isActive = isActive;
        users[index].updatedAt = new Date().toISOString();

        await writeData('users.json', users);

        res.json({
            success: true,
            message: `Customer ${isActive ? 'activated' : 'deactivated'} successfully`
        });
    } catch (err) {
        console.error('Error updating customer status:', err);
        res.status(500).json({ success: false, message: 'Failed to update customer status' });
    }
});

// ============================================================
// 5. ADMIN PAYMENTS
// GET /api/admin/payments
// GET /api/admin/payments/:id
// PATCH /api/admin/payments/:id/status
// ============================================================
router.get('/payments', (req, res) => {
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
                serviceName: service ? service.name : 'Unknown Service',
                customerName: user ? user.fullName : 'Unknown Customer',
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
                (p.paymentReference && p.paymentReference.toLowerCase().includes(q)) ||
                (p.bookingId && p.bookingId.toLowerCase().includes(q)) ||
                (p.customerName && p.customerName.toLowerCase().includes(q)) ||
                (p.serviceName && p.serviceName.toLowerCase().includes(q))
            );
        }

        res.json({ success: true, payments: allPayments });
    } catch (err) {
        console.error('Error fetching admin payments:', err);
        res.status(500).json({ success: false, message: 'Failed to load payments' });
    }
});

router.get('/payments/:id', (req, res) => {
    try {
        const payments = readData('payments.json');
        const payment = findById(payments, req.params.id);

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        const reservations = readData('reservations.json');
        const reservation = findById(reservations, payment.reservationId);
        const services = readData('services.json');
        const service = reservation ? findById(services, reservation.serviceId) : null;
        const users = readData('users.json');
        const user = findById(users, payment.userId);

        res.json({
            success: true,
            payment: {
                ...payment,
                bookingId: reservation ? reservation.bookingId : 'N/A',
                serviceName: service ? service.name : 'Unknown',
                reservationDate: reservation ? reservation.reservationDate : '',
                timeSlot: reservation ? reservation.timeSlot : '',
                quantity: reservation ? reservation.quantity : 0,
                customerName: user ? user.fullName : 'Customer',
                customerEmail: user ? user.email : ''
            }
        });
    } catch (err) {
        console.error('Error fetching payment:', err);
        res.status(500).json({ success: false, message: 'Failed to load payment' });
    }
});

router.patch('/payments/:id/status', async (req, res) => {
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

        // Update reservation payment status
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

// ============================================================
// 6. ADMIN SETTINGS
// GET /api/admin/settings
// PUT /api/admin/settings
// ============================================================
router.get('/settings', (req, res) => {
    try {
        const settings = readData('settings.json');
        res.json({ success: true, settings });
    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).json({ success: false, message: 'Failed to load settings' });
    }
});

router.put('/settings', async (req, res) => {
    try {
        const settings = readData('settings.json');
        const {
            applicationName,
            currency,
            currencySymbol,
            cancellationPolicy,
            contactEmail,
            contactPhone,
            enabledPaymentMethods,
            bookingTimeRestrictions
        } = req.body;

        if (applicationName) settings.applicationName = sanitizeString(applicationName);
        if (currency) settings.currency = sanitizeString(currency);
        if (currencySymbol) settings.currencySymbol = sanitizeString(currencySymbol);
        if (cancellationPolicy) settings.cancellationPolicy = sanitizeString(cancellationPolicy);
        if (contactEmail) settings.contactEmail = sanitizeString(contactEmail);
        if (contactPhone) settings.contactPhone = sanitizeString(contactPhone);
        if (enabledPaymentMethods) settings.enabledPaymentMethods = enabledPaymentMethods;
        if (bookingTimeRestrictions) settings.bookingTimeRestrictions = sanitizeString(bookingTimeRestrictions);
        settings.updatedAt = new Date().toISOString();

        await writeData('settings.json', settings);

        res.json({
            success: true,
            message: 'Settings updated successfully',
            settings
        });
    } catch (err) {
        console.error('Error updating settings:', err);
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
});

module.exports = router;
