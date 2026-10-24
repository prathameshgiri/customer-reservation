// ============================================================
// Service Routes
// Public: GET /api/services, GET /api/services/:id
// Admin: POST/PUT/DELETE /api/admin/services
// ============================================================

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { readData, writeData, findById } = require('../utils/jsonDatabase');
const { generateId } = require('../utils/idGenerator');
const { sanitizeString, isPositiveNumber } = require('../utils/validators');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// GET /api/services - Public: list all active services
router.get('/', (req, res) => {
    try {
        const services = readData('services.json');
        const { search, category, minPrice, maxPrice, availability } = req.query;

        let filtered = services.filter(s => s.isActive);

        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q)
            );
        }

        if (category && category !== 'all') {
            filtered = filtered.filter(s => s.category === category);
        }

        if (minPrice) {
            filtered = filtered.filter(s => s.price >= parseFloat(minPrice));
        }
        if (maxPrice) {
            filtered = filtered.filter(s => s.price <= parseFloat(maxPrice));
        }

        // Get unique categories
        const categories = [...new Set(services.filter(s => s.isActive).map(s => s.category))];

        res.json({
            success: true,
            services: filtered.map(s => ({
                id: s.id,
                name: s.name,
                description: s.description,
                category: s.category,
                price: s.price,
                image: s.image,
                capacity: s.capacity,
                availableDates: s.availableDates,
                timeSlots: s.timeSlots,
                isActive: s.isActive
            })),
            categories
        });
    } catch (err) {
        console.error('Error fetching services:', err);
        res.status(500).json({ success: false, message: 'Failed to load services' });
    }
});

// GET /api/services/:id - Public: get service details
router.get('/:id', (req, res) => {
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

// GET /api/admin/services - Admin: list all services (including inactive)
router.get('/admin', requireAuth, requireAdmin, (req, res) => {
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
                s.name.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q) ||
                s.category.toLowerCase().includes(q)
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

// GET /api/admin/services/:id - Admin: get single service
router.get('/admin/:id', requireAuth, requireAdmin, (req, res) => {
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

// POST /api/admin/services - Admin: create service
router.post('/admin', requireAuth, requireAdmin, [
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
                message: errors.array()[0].msg,
                errors: errors.array()
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
            capacity: parseInt(capacity),
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

// PUT /api/admin/services/:id - Admin: update service
router.put('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
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
        if (capacity !== undefined) services[index].capacity = parseInt(capacity);
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

// DELETE /api/admin/services/:id - Admin: delete/deactivate service
router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const services = readData('services.json');
        const index = services.findIndex(s => s.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        // Check for existing reservations
        const reservations = readData('reservations.json');
        const hasReservations = reservations.some(r =>
            r.serviceId === req.params.id &&
            ['Pending', 'Confirmed'].includes(r.reservationStatus)
        );

        if (hasReservations) {
            // Deactivate instead of delete
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

module.exports = router;
