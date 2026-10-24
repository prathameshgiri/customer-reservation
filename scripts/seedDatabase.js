// ============================================================
// Database Seed Script
// Creates initial admin account and sample services
// ============================================================

require('dotenv').config();

const bcrypt = require('bcryptjs');
const { readData, writeData, initializeAllDatabases, findByField } = require('../src/utils/jsonDatabase');
const { generateId } = require('../src/utils/idGenerator');

async function seedDatabase() {
    console.log('🌱 Starting database seed...\n');

    // Initialize all database files
    initializeAllDatabases();
    console.log('✅ Database files initialized');

    // Create admin account (if not exists)
    const users = readData('users.json');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@reservations.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';
    const adminPhone = process.env.ADMIN_PHONE || '9876543210';

    const existingAdmin = findByField(users, 'email', adminEmail);
    if (!existingAdmin) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(adminPassword, salt);

        const admin = {
            id: generateId(),
            fullName: adminName,
            email: adminEmail,
            phone: adminPhone,
            passwordHash,
            role: 'admin',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        users.push(admin);
        await writeData('users.json', users);
        console.log(`✅ Admin account created: ${adminEmail}`);
    } else {
        console.log(`ℹ️  Admin account already exists: ${adminEmail}`);
    }

    // Create demo customer account (if not exists)
    const customerEmail = 'customer@example.com';
    const customerPassword = 'Customer@123';
    const existingCustomer = findByField(users, 'email', customerEmail);
    if (!existingCustomer) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(customerPassword, salt);

        const customer = {
            id: generateId(),
            fullName: 'Rahul Sharma',
            email: customerEmail,
            phone: '9876543211',
            passwordHash,
            role: 'customer',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        users.push(customer);
        await writeData('users.json', users);
        console.log(`✅ Demo Customer created: ${customerEmail}`);
    } else {
        console.log(`ℹ️  Customer account already exists: ${customerEmail}`);
    }

    // Create sample services (if none exist)
    const services = readData('services.json');
    if (services.length === 0) {
        const sampleServices = [
            {
                id: generateId(),
                name: 'Luxury Spa Treatment',
                description: 'Indulge in our premium spa experience with full-body massage, aromatherapy, and relaxation therapy. Perfect for stress relief and rejuvenation.',
                category: 'Spa & Wellness',
                price: 2500,
                image: '',
                capacity: 5,
                availableDates: [],
                timeSlots: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'],
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'Fine Dining Experience',
                description: 'Enjoy an exclusive dining experience with a curated multi-course menu prepared by our award-winning chef. Includes wine pairing and personalized service.',
                category: 'Dining',
                price: 3500,
                image: '',
                capacity: 20,
                availableDates: [],
                timeSlots: ['12:00', '13:00', '14:00', '19:00', '20:00', '21:00'],
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'Conference Room Booking',
                description: 'Modern conference room with projector, whiteboard, high-speed Wi-Fi, and seating for up to 30 people. Ideal for meetings and presentations.',
                category: 'Business',
                price: 5000,
                image: '',
                capacity: 3,
                availableDates: [],
                timeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'Yoga & Meditation Session',
                description: 'Join our expert instructors for guided yoga and meditation sessions. Suitable for beginners and advanced practitioners.',
                category: 'Spa & Wellness',
                price: 800,
                image: '',
                capacity: 15,
                availableDates: [],
                timeSlots: ['06:00', '07:00', '08:00', '17:00', '18:00'],
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'Swimming Pool Access',
                description: 'Enjoy our temperature-controlled Olympic-size pool with dedicated lanes, locker facilities, and poolside refreshments included.',
                category: 'Recreation',
                price: 500,
                image: '',
                capacity: 25,
                availableDates: [],
                timeSlots: ['06:00', '07:00', '08:00', '09:00', '10:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'Private Movie Screening',
                description: 'Book our private screening room with Dolby surround sound, 4K projector, luxury recliners, and complimentary popcorn and beverages.',
                category: 'Entertainment',
                price: 8000,
                image: '',
                capacity: 2,
                availableDates: [],
                timeSlots: ['10:00', '13:00', '16:00', '19:00'],
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'Photography Studio',
                description: 'Professional photography studio with multiple backdrop options, studio lighting, and props. Photographer available on request.',
                category: 'Creative',
                price: 3000,
                image: '',
                capacity: 4,
                availableDates: [],
                timeSlots: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'],
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'Banquet Hall',
                description: 'Spacious and elegantly decorated banquet hall perfect for weddings, receptions, and corporate events. Accommodates up to 200 guests.',
                category: 'Events',
                price: 25000,
                image: '',
                capacity: 3,
                availableDates: [],
                timeSlots: ['10:00', '14:00', '18:00'],
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];

        await writeData('services.json', sampleServices);
        console.log(`✅ ${sampleServices.length} sample services created`);
    } else {
        console.log(`ℹ️  Services already exist (${services.length} found)`);
    }

    console.log('\n🎉 Database seeding completed!');
    console.log('\n📋 Login Credentials:');
    console.log(`   🛡️ Admin Portal (Port 3000):    http://localhost:3000`);
    console.log(`      Email:    ${adminEmail}`);
    console.log(`      Password: ${adminPassword}`);
    console.log(`   👤 Customer Portal (Port 3030): http://localhost:3030`);
    console.log(`      Email:    customer@example.com (or prathameshgiri8607@gmail.com)`);
    console.log(`      Password: Customer@123`);
    console.log('\n💡 Run "npm start" to launch both portals simultaneously.');
}

seedDatabase().catch(err => {
    console.error('❌ Seed error:', err);
    process.exit(1);
});
