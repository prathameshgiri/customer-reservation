// ============================================================
// Automated End-to-End Verification Test Script
// Tests all 18 workflows specified in Section 10 of PRD
// ============================================================

const http = require('http');

const BASE_URL = 'http://localhost:3030';

// Cookie jar for session management
function createSession() {
    let cookies = '';

    function request(method, path, body = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, BASE_URL);
            const headers = {
                'Content-Type': 'application/json'
            };
            if (cookies) {
                headers['Cookie'] = cookies;
            }

            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method,
                headers
            };

            const req = http.request(options, (res) => {
                let data = '';

                // Capture cookies
                const setCookie = res.headers['set-cookie'];
                if (setCookie) {
                    cookies = setCookie.map(c => c.split(';')[0]).join('; ');
                }

                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    let json = null;
                    try {
                        json = JSON.parse(data);
                    } catch (e) {
                        json = data;
                    }
                    resolve({ status: res.statusCode, headers: res.headers, body: json });
                });
            });

            req.on('error', reject);

            if (body) {
                req.write(JSON.stringify(body));
            }
            req.end();
        });
    }

    return {
        get: (path) => request('GET', path),
        post: (path, body) => request('POST', path, body),
        put: (path, body) => request('PUT', path, body),
        patch: (path, body) => request('PATCH', path, body),
        delete: (path) => request('DELETE', path)
    };
}

async function runTests() {
    console.log('🧪 Starting 18-Workflow Verification Test Suite...\n');

    let passed = 0;
    let failed = 0;

    function assert(testName, condition, detail = '') {
        if (condition) {
            console.log(`✅ [PASS] ${testName}`);
            passed++;
        } else {
            console.error(`❌ [FAIL] ${testName} - ${detail}`);
            failed++;
        }
    }

    const customer1 = createSession();
    const customer2 = createSession();
    const admin = createSession();

    const timestamp = Date.now();
    const cust1Email = `testuser_${timestamp}@example.com`;
    const cust2Email = `testuser2_${timestamp}@example.com`;
    const password = 'Password@123';

    try {
        // 1. Register a new customer
        const regRes = await customer1.post('/api/auth/register', {
            fullName: 'Rahul Sharma',
            email: cust1Email,
            phone: '9876543210',
            password: password,
            confirmPassword: password
        });
        assert('1. Register new customer', regRes.status === 201 && regRes.body.success, JSON.stringify(regRes.body));

        // 2. Prevent duplicate registration
        const dupRes = await customer2.post('/api/auth/register', {
            fullName: 'Duplicate User',
            email: cust1Email,
            phone: '9876543211',
            password: password,
            confirmPassword: password
        });
        assert('2. Prevent duplicate registration', (dupRes.status === 409 || dupRes.status === 400) && !dupRes.body.success, JSON.stringify(dupRes.body));

        // 3. Register and login customer 2
        const reg2Res = await customer2.post('/api/auth/register', {
            fullName: 'Pooja Verma',
            email: cust2Email,
            phone: '9876543212',
            password: password,
            confirmPassword: password
        });
        assert('3a. Register second customer', reg2Res.status === 201 && reg2Res.body.success);

        const login2Res = await customer2.post('/api/auth/login', {
            email: cust2Email,
            password: password
        });
        const cust2UserId = login2Res.body.user.id;
        assert('3b. Log in second customer', login2Res.status === 200 && cust2UserId);

        // 4. Log in and log out
        const logoutRes = await customer1.post('/api/auth/logout');
        assert('4a. Log out customer', logoutRes.status === 200 && logoutRes.body.success);

        const loginRes = await customer1.post('/api/auth/login', {
            email: cust1Email,
            password: password
        });
        assert('4b. Log in customer', loginRes.status === 200 && loginRes.body.success);

        // 5. Browse and search services
        const servicesRes = await customer1.get('/api/services?search=Spa');
        assert('5. Browse and search services', servicesRes.status === 200 && servicesRes.body.services.length > 0 && servicesRes.body.services[0].name.includes('Spa'));

        const targetService = servicesRes.body.services[0];
        const serviceId = targetService.id;

        // 6. Check available dates and slots
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        const bookingDate = tomorrow.toISOString().split('T')[0];

        const availRes = await customer1.get(`/api/reservations/availability/check?serviceId=${serviceId}&date=${bookingDate}`);
        assert('6. Check available slots', availRes.status === 200 && availRes.body.slots && availRes.body.slots.length > 0);

        const selectedSlot = availRes.body.slots[0].time;

        // 7. Make a valid reservation
        const makeRes = await customer1.post('/api/reservations', {
            serviceId,
            reservationDate: bookingDate,
            timeSlot: selectedSlot,
            quantity: 1,
            specialInstructions: 'Window seat preferred'
        });
        assert('7. Make valid reservation', makeRes.status === 201 && makeRes.body.success && makeRes.body.reservation.bookingId.startsWith('RES-'));

        const reservationId = makeRes.body.reservation.id;

        // 8. Reject a reservation for an invalid / past date
        const pastRes = await customer1.post('/api/reservations', {
            serviceId,
            reservationDate: '2020-01-01',
            timeSlot: selectedSlot,
            quantity: 1
        });
        assert('8. Reject past date booking', pastRes.status === 400 && !pastRes.body.success);

        // 9. Prevent overbooking
        const overbookRes = await customer1.post('/api/reservations', {
            serviceId,
            reservationDate: bookingDate,
            timeSlot: selectedSlot,
            quantity: 9999 // Exceeds capacity
        });
        assert('9. Prevent overbooking beyond capacity', overbookRes.status === 400 && !overbookRes.body.success);

        // 10. Process demo payment and verify receipt
        const payRes = await customer1.post('/api/payments', {
            reservationId,
            paymentMethod: 'UPI'
        });
        assert('10a. Process demo payment', payRes.status === 201 && payRes.body.success && payRes.body.payment.paymentReference.startsWith('PAY-'));

        const getReceiptRes = await customer1.get(`/api/payments/${payRes.body.payment.id}`);
        assert('10b. Generate printable receipt details', getReceiptRes.status === 200 && getReceiptRes.body.payment.paymentStatus === 'Paid');

        // 11. Customer access restriction (customer cannot access admin dashboard)
        const unauthAdminRes = await customer1.get('/api/admin/dashboard');
        assert('11. Customer restricted from admin endpoints', unauthAdminRes.status === 403 && !unauthAdminRes.body.success);

        // 12. Cross-customer protection: customer 2 cannot view or cancel customer 1's booking
        const crossAccessRes = await customer2.get(`/api/reservations/${reservationId}`);
        assert('12. Protect cross-customer reservation access', crossAccessRes.status === 403 && !crossAccessRes.body.success);

        // 13. Admin login and dashboard
        const adminLoginRes = await admin.post('/api/auth/login', {
            email: 'admin@reservations.com',
            password: 'Admin@123'
        });
        assert('13a. Admin login', adminLoginRes.status === 200 && adminLoginRes.body.user.role === 'admin');

        const adminDashRes = await admin.get('/api/admin/dashboard');
        assert('13b. Admin dashboard statistics', adminDashRes.status === 200 && adminDashRes.body.stats.totalReservations >= 1);

        // 14. Admin services management (Add, Edit, Deactivate)
        const createServiceRes = await admin.post('/api/admin/services', {
            name: 'VIP Executive Lounge',
            category: 'Business',
            description: 'Exclusive lounge with refreshments and meeting pods',
            price: 1800,
            capacity: 10,
            timeSlots: ['10:00', '12:00', '14:00', '16:00'],
            isActive: true
        });
        assert('14a. Admin create new service', createServiceRes.status === 201 && createServiceRes.body.success);

        const newServiceId = createServiceRes.body.service.id;
        const updateServiceRes = await admin.put(`/api/admin/services/${newServiceId}`, {
            price: 2000
        });
        assert('14b. Admin update service price', updateServiceRes.status === 200 && updateServiceRes.body.service.price === 2000);

        const deleteServiceRes = await admin.delete(`/api/admin/services/${newServiceId}`);
        assert('14c. Admin delete empty service', deleteServiceRes.status === 200 && deleteServiceRes.body.success);

        // 15. Admin customer management (activate/deactivate)
        const custDetailsRes = await admin.get(`/api/admin/customers/${cust2UserId}`);
        assert('15a. Admin view customer details', custDetailsRes.status === 200 && custDetailsRes.body.customer.email === cust2Email);

        const toggleCustRes = await admin.patch(`/api/admin/customers/${cust2UserId}/status`, {
            isActive: false
        });
        assert('15b. Admin deactivate customer account', toggleCustRes.status === 200 && toggleCustRes.body.success);

        // 16. Admin reservation management (update status)
        const adminResList = await admin.get('/api/admin/reservations');
        assert('16a. Admin list all reservations', adminResList.status === 200 && adminResList.body.reservations.length > 0);

        const updateStatusRes = await admin.patch(`/api/admin/reservations/${reservationId}/status`, {
            status: 'Confirmed'
        });
        assert('16b. Admin confirm reservation', updateStatusRes.status === 200 && updateStatusRes.body.reservation.reservationStatus === 'Confirmed');

        // 17. System Settings update
        const settingsRes = await admin.put('/api/admin/settings', {
            applicationName: 'ReserveEase Pro'
        });
        assert('17. Admin update system settings', settingsRes.status === 200 && settingsRes.body.settings.applicationName === 'ReserveEase Pro');

        // 18. Customer profile and password update
        const profileUpdateRes = await customer1.put('/api/customer/profile', {
            fullName: 'Rahul Sharma Updated',
            phone: '9876500000'
        });
        assert('18a. Customer profile update', profileUpdateRes.status === 200 && profileUpdateRes.body.user.fullName === 'Rahul Sharma Updated');

        const pwdChangeRes = await customer1.put('/api/customer/password', {
            currentPassword: password,
            newPassword: 'NewPassword@123',
            confirmPassword: 'NewPassword@123'
        });
        assert('18b. Customer password change', pwdChangeRes.status === 200 && pwdChangeRes.body.success);

    } catch (err) {
        console.error('Test execution error:', err);
    }

    console.log('\n========================================');
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('========================================\n');

    if (failed === 0) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

runTests();
