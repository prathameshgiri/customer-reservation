// ============================================================
// Customer & Dashboard Routes
// GET /api/customer/dashboard, /api/customer/profile
// Admin customer management endpoints
// ============================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { readData, writeData, findById } = require('../utils/jsonDatabase');
const { sanitizeString, isValidPhone, isValidPassword } = require('../utils/validators');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// GET /api/customer/dashboard - Customer dashboard stats
router.get('/dashboard', requireAuth, (req, res) => {
    try {
        const reservations = readData('reservations.json');
        const services = readData('services.json');

        const myReservations = reservations.filter(r => r.userId === req.user.id);
        const today = new Date().toISOString().split('T')[0];

        const stats = {
            totalBookings: myReservations.length,
            upcomingBookings: myReservations.filter(r =>
                r.reservationDate >= today &&
                ['Pending', 'Confirmed'].includes(r.reservationStatus)
            ).length,
            completedBookings: myReservations.filter(r => r.reservationStatus === 'Completed').length,
            cancelledBookings: myReservations.filter(r => r.reservationStatus === 'Cancelled').length,
            pendingPayments: myReservations.filter(r =>
                r.paymentStatus === 'Pending' &&
                ['Pending', 'Confirmed'].includes(r.reservationStatus)
            ).length,
            totalSpent: myReservations
                .filter(r => r.paymentStatus === 'Paid')
                .reduce((sum, r) => sum + r.totalAmount, 0)
        };

        // Recent bookings
        const recentBookings = myReservations
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map(r => {
                const service = findById(services, r.serviceId);
                return {
                    bookingId: r.bookingId,
                    serviceName: service ? service.name : 'Unknown',
                    reservationDate: r.reservationDate,
                    timeSlot: r.timeSlot,
                    totalAmount: r.totalAmount,
                    reservationStatus: r.reservationStatus,
                    paymentStatus: r.paymentStatus,
                    id: r.id
                };
            });

        res.json({
            success: true,
            stats,
            recentBookings,
            user: req.user
        });
    } catch (err) {
        console.error('Error fetching customer dashboard:', err);
        res.status(500).json({ success: false, message: 'Failed to load dashboard' });
    }
});

// GET /api/customer/profile - Get profile
router.get('/profile', requireAuth, (req, res) => {
    res.json({ success: true, user: req.user });
});

// PUT /api/customer/profile - Update profile
router.put('/profile', requireAuth, async (req, res) => {
    try {
        const { fullName, phone } = req.body;
        const users = readData('users.json');
        const index = users.findIndex(u => u.id === req.user.id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (fullName) {
            const name = sanitizeString(fullName);
            if (name.length < 2) {
                return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
            }
            users[index].fullName = name;
        }

        if (phone) {
            if (!isValidPhone(phone)) {
                return res.status(400).json({ success: false, message: 'Invalid mobile number format' });
            }
            users[index].phone = sanitizeString(phone);
        }

        users[index].updatedAt = new Date().toISOString();
        await writeData('users.json', users);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: users[index].id,
                fullName: users[index].fullName,
                email: users[index].email,
                phone: users[index].phone,
                role: users[index].role,
                createdAt: users[index].createdAt
            }
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

// PUT /api/customer/password - Change password
router.put('/password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'All password fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'New passwords do not match' });
        }

        if (!isValidPassword(newPassword)) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters with 1 letter and 1 number' });
        }

        const users = readData('users.json');
        const user = findById(users, req.user.id);

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        const index = users.findIndex(u => u.id === req.user.id);
        users[index].passwordHash = passwordHash;
        users[index].updatedAt = new Date().toISOString();

        await writeData('users.json', users);

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ success: false, message: 'Failed to change password' });
    }
});

// ==================== ADMIN ROUTES ====================

// GET /api/admin/customers - Admin: list all customers
router.get('/admin/customers', requireAuth, requireAdmin, (req, res) => {
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

        // Search
        const { search } = req.query;
        if (search) {
            const q = search.toLowerCase();
            customers = customers.filter(c =>
                c.fullName.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                c.phone.includes(q)
            );
        }

        res.json({ success: true, customers });
    } catch (err) {
        console.error('Error fetching customers:', err);
        res.status(500).json({ success: false, message: 'Failed to load customers' });
    }
});

// GET /api/admin/customers/:id - Admin: get customer detail
router.get('/admin/customers/:id', requireAuth, requireAdmin, (req, res) => {
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

// PATCH /api/admin/customers/:id/status - Admin: activate/deactivate customer
router.patch('/admin/customers/:id/status', requireAuth, requireAdmin, async (req, res) => {
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

// GET /api/admin/dashboard - Admin dashboard stats
router.get('/admin/dashboard', requireAuth, requireAdmin, (req, res) => {
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
                .reduce((sum, p) => sum + p.amount, 0),
            pendingPayments: payments.filter(p => p.paymentStatus === 'Pending').length
        };

        // Monthly booking trends (last 6 months)
        const monthlyTrends = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const month = d.toISOString().slice(0, 7);
            const monthName = d.toLocaleString('default', { month: 'short', year: 'numeric' });
            const monthReservations = reservations.filter(r => r.createdAt && r.createdAt.startsWith(month));
            const monthRevenue = payments
                .filter(p => p.paymentStatus === 'Paid' && p.createdAt && p.createdAt.startsWith(month))
                .reduce((sum, p) => sum + p.amount, 0);
            monthlyTrends.push({
                month: monthName,
                bookings: monthReservations.length,
                revenue: monthRevenue
            });
        }

        // Bookings by status
        const bookingsByStatus = {
            Pending: stats.pendingReservations,
            Confirmed: stats.confirmedReservations,
            Completed: stats.completedReservations,
            Cancelled: stats.cancelledReservations
        };

        // Recent reservations
        const recentReservations = reservations
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10)
            .map(r => {
                const service = findById(services, r.serviceId);
                const user = findById(users, r.userId);
                return {
                    bookingId: r.bookingId,
                    customerName: user ? user.fullName : 'Unknown',
                    serviceName: service ? service.name : 'Unknown',
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

module.exports = router;
