// ============================================================
// Authentication Routes
// POST /api/auth/register, /api/auth/login, /api/auth/logout
// GET /api/auth/me
// ============================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { readData, writeData, findByField } = require('../utils/jsonDatabase');
const { generateId } = require('../utils/idGenerator');
const { isValidEmail, isValidPhone, isValidPassword, sanitizeString } = require('../utils/validators');
const { requireAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { success: false, message: 'Too many requests. Please try again after 15 minutes.' }
});

// POST /api/auth/register
router.post('/register', authLimiter, [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Mobile number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').notEmpty().withMessage('Confirm password is required')
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

        let { fullName, email, phone, password, confirmPassword } = req.body;

        // Sanitize
        fullName = sanitizeString(fullName);
        email = email.trim().toLowerCase();
        phone = sanitizeString(phone);

        // Validate email format
        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        // Validate phone format
        if (!isValidPhone(phone)) {
            return res.status(400).json({ success: false, message: 'Invalid mobile number. Must be 10 digits starting with 6-9' });
        }

        // Validate password strength
        if (!isValidPassword(password)) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters with at least 1 letter and 1 number' });
        }

        // Check passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        // Check duplicate email
        const users = readData('users.json');
        const existingUser = findByField(users, 'email', email);
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const newUser = {
            id: generateId(),
            fullName,
            email,
            phone,
            passwordHash,
            role: 'customer',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        users.push(newUser);
        await writeData('users.json', users);

        res.status(201).json({
            success: true,
            message: 'Registration successful! You can now log in.'
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
});

// POST /api/auth/login
router.post('/login', authLimiter, [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { email, password } = req.body;
        const users = readData('users.json');
        const user = findByField(users, 'email', email.trim().toLowerCase());

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact administrator.' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Create session
        req.session.userId = user.id;
        req.session.userRole = user.role;

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.clearCookie('reserveease.sid');
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

module.exports = router;
