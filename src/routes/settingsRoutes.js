// ============================================================
// Settings Routes
// GET /api/settings, PUT /api/admin/settings
// ============================================================

const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/jsonDatabase');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// GET /api/settings and GET /api/admin/settings - Get application settings
const getSettingsHandler = (req, res) => {
    try {
        const settings = readData('settings.json');
        res.json({ success: true, settings });
    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).json({ success: false, message: 'Failed to load settings' });
    }
};

router.get('/', getSettingsHandler);
router.get('/admin', requireAuth, requireAdmin, getSettingsHandler);

// PUT /api/admin/settings - Admin: update settings
router.put('/admin', requireAuth, requireAdmin, async (req, res) => {
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

        if (applicationName) settings.applicationName = applicationName;
        if (currency) settings.currency = currency;
        if (currencySymbol) settings.currencySymbol = currencySymbol;
        if (cancellationPolicy) settings.cancellationPolicy = cancellationPolicy;
        if (contactEmail) settings.contactEmail = contactEmail;
        if (contactPhone) settings.contactPhone = contactPhone;
        if (enabledPaymentMethods) settings.enabledPaymentMethods = enabledPaymentMethods;
        if (bookingTimeRestrictions) settings.bookingTimeRestrictions = bookingTimeRestrictions;
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
