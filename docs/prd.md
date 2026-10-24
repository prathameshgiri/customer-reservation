# Project: Customer Reservation & Booking Management System

## 1. Project Overview

Develop a complete, functional, and responsive web application named **Customer Reservation & Booking Management System** using HTML, CSS, JavaScript, Node.js, Express.js, and a local JSON file-based database.

The application should allow customers to register, log in, explore available services, check availability, make reservations, manage bookings, and view payment records. It should also provide an administrator dashboard to manage customers, services, reservations, availability, and payments.

This project is intended for MCA college submission. The application must be fully functional, easy to use, professionally designed, and suitable for demonstrating a real-world reservation management system.

## 2. Technology Stack

### Frontend
- HTML5 for page structure.
- CSS3 for styling, responsive layouts, animations, and modern UI.
- Vanilla JavaScript for dynamic interactions and API communication.
- Fetch API for connecting the frontend with the backend.
- Chart.js for dashboard charts, if required.

### Backend
- Node.js as the server runtime.
- Express.js for API development and routing.
- bcryptjs for password hashing.
- express-session for session-based authentication.
- express-validator for input validation.

### Database
Use a **local JSON file-based database** instead of MySQL, MongoDB, or any cloud database.

Store application data in separate JSON files, including:
- `users.json`
- `services.json`
- `reservations.json`
- `payments.json`
- `settings.json`

All JSON files must be created automatically when the application starts if they do not exist. The backend must handle reading, writing, validation, and error handling for all database operations.

Do not use localStorage as the main database. All permanent application data must be managed through the Node.js backend.

## 3. User Interface and Design

Create a premium, modern, professional web interface with a clean and intuitive layout.

Design requirements:
- Responsive design for desktop, laptop, tablet, and mobile.
- Modern dashboard with a collapsible sidebar.
- Clean typography and consistent spacing.
- Attractive cards, tables, forms, buttons, and modal dialogs.
- Professional color palette using white, navy blue, and subtle gradients.
- Smooth hover effects and lightweight animations.
- Consistent icons using Lucide icons or Font Awesome.
- Loading indicators, skeleton screens where appropriate, and toast notifications.
- Confirmation dialogs before deleting or cancelling records.
- Proper empty states, validation messages, and error messages.
- Accessible forms with labels and keyboard-friendly controls.

Create separate, consistent interfaces for customers and administrators. Do not make the application look like a basic HTML college project or a generic template.

## 4. Customer Module

### A. User Registration
Allow new customers to register with:
- Full name.
- Email address.
- Mobile number.
- Password.
- Confirm password.

Requirements:
- Validate all fields.
- Prevent duplicate email addresses.
- Validate email and mobile number formats.
- Hash passwords using bcryptjs.
- Never store plaintext passwords in JSON files.
- Show clear success and error notifications.

### B. Login and Authentication
- Allow registered customers to log in using email and password.
- Maintain authenticated sessions.
- Provide logout functionality.
- Prevent unauthorized access to customer and admin pages.
- Use role-based access control.
- Restrict admin routes to authorized administrators only.
- Configure secure session cookies appropriately for the local development environment.

### C. Customer Dashboard
Display:
- Welcome message.
- Total bookings.
- Upcoming bookings.
- Completed bookings.
- Cancelled bookings.
- Recent booking activity.
- Quick action to make a reservation.

Provide a clear summary of the customer's booking history.

### D. Browse Services
Display all active services as attractive cards.

Each service should contain:
- Service name.
- Description.
- Category.
- Price.
- Image or appropriate placeholder.
- Availability status.
- Booking action.

Allow customers to search services by name and filter by category, price, or availability.

The administrator must be able to manage these services.

### E. Make a Reservation
Create a complete booking form with:
- Service selection.
- Reservation date.
- Available time slot.
- Number of people or required quantity, depending on the service.
- Customer details.
- Optional special instructions.
- Automatic price calculation.
- Final booking summary.

Requirements:
- Prevent bookings for past dates.
- Validate date, time, quantity, and service availability.
- Prevent overlapping or duplicate bookings where applicable.
- Prevent overbooking by checking availability on the server.
- Calculate the total amount on the backend instead of trusting the frontend.
- Generate a unique booking ID, such as `RES-2026-0001`.
- Save the booking to `reservations.json`.
- Display a booking confirmation after successful creation.

### F. My Reservations
Create a customer booking management page.

Display:
- Booking ID.
- Service name.
- Booking date and time.
- Quantity.
- Total amount.
- Payment status.
- Reservation status.
- Booking creation date.

Provide options to:
- View full booking details.
- Cancel an eligible reservation.
- Modify an eligible reservation.
- Filter by status and date.
- Search by booking ID.

Apply clear cancellation and modification rules. Recheck availability before updating a booking, and never allow customers to modify another customer's reservation.

Suggested statuses:
- Pending.
- Confirmed.
- Completed.
- Cancelled.

### G. Payment and Booking Receipts
Implement a payment-record module suitable for a college project.

Features:
- Display the reservation amount.
- Allow a customer to select an available payment method, such as Cash, Card, or UPI.
- For a simulated online payment, provide a clearly labelled demo payment flow.
- Generate a unique payment reference.
- Store payment records in `payments.json`.
- Display payment status and transaction details.
- Generate a printable booking receipt.

Do not claim that real money has been transferred. Do not collect or store actual card numbers, CVVs, UPI PINs, or banking credentials.

Suggested payment statuses:
- Pending.
- Paid.
- Failed.
- Refunded.

Only mark a payment as paid after the appropriate successful payment flow. Clearly distinguish demo payments from actual transactions.

### H. Customer Profile
Allow customers to:
- View their profile.
- Update their name and mobile number.
- Change their password.
- View account creation date.
- Log out securely.

Validate all profile updates on the server.

## 5. Administrator Module

Create a separate admin login and dashboard.

### A. Admin Dashboard
Display summary cards for:
- Total customers.
- Total reservations.
- Today's reservations.
- Upcoming reservations.
- Cancelled reservations.
- Total recorded payments.
- Revenue from eligible paid reservations.

Add charts for:
- Bookings by status.
- Monthly booking trends.
- Revenue trends.

Use real data from the JSON files. Do not display hardcoded statistics.

### B. Customer Management
Allow administrators to:
- View all registered customers.
- Search customers by name, email, or phone.
- View customer details.
- Filter customer records.
- Activate or deactivate customer accounts.
- View a customer's reservation history.

Do not display customer passwords or password hashes.

### C. Service Management
Allow administrators to:
- Add new services.
- Edit existing services.
- Delete or deactivate services.
- Set service name and description.
- Set category and price.
- Configure service availability.
- Set capacity or maximum booking quantity.
- Configure available booking dates and time slots.
- Set active or inactive status.

Prevent the deletion of services that have existing reservations if doing so would damage historical records. Prefer deactivation instead.

### D. Reservation Management
Allow administrators to:
- View all reservations.
- Search by booking ID or customer.
- Filter by date, service, payment status, and reservation status.
- View complete booking information.
- Confirm eligible pending reservations.
- Modify booking status.
- Cancel reservations with an appropriate reason.
- Mark eligible reservations as completed.
- Review booking and payment history.

Record important status changes and update the associated records consistently.

### E. Availability Management
Provide controls for:
- Available dates.
- Time slots.
- Maximum capacity.
- Service availability.
- Booking limits.
- Blocked dates or unavailable time slots.

Ensure the backend performs availability checks whenever a reservation is created or modified. Do not rely solely on frontend validation.

### F. Payment Management
Allow administrators to:
- View payment records.
- Search by payment reference or booking ID.
- Filter by payment method and status.
- View payment details.
- Review failed and pending payments.
- Record authorized refund or adjustment actions with an audit trail.

Do not permit arbitrary payment-status changes that falsely represent actual transactions.

### G. System Settings
Provide configurable settings such as:
- Application name.
- Currency, default INR (₹).
- Reservation cancellation policy.
- Booking time restrictions.
- Contact details.
- Default booking statuses.
- Available payment methods.

## 6. JSON Database Structure

Create the following database files inside a dedicated `database/` directory.

### users.json
Store:
- id
- fullName
- email
- phone
- passwordHash
- role (`customer` or `admin`)
- isActive
- createdAt
- updatedAt

### services.json
Store:
- id
- name
- description
- category
- price
- image
- capacity
- availableDates
- timeSlots
- isActive
- createdAt
- updatedAt

### reservations.json
Store:
- id
- bookingId
- userId
- serviceId
- reservationDate
- timeSlot
- quantity
- unitPrice
- totalAmount
- specialInstructions
- reservationStatus
- paymentStatus
- cancellationReason
- createdAt
- updatedAt

### payments.json
Store:
- id
- paymentReference
- reservationId
- userId
- amount
- paymentMethod
- paymentStatus
- isDemoTransaction
- createdAt
- updatedAt

### settings.json
Store:
- applicationName
- currency
- cancellationPolicy
- contactEmail
- contactPhone
- enabledPaymentMethods
- updatedAt

Use unique IDs for every record. Validate relationships between users, services, reservations, and payments.

Implement reusable backend functions for reading and writing JSON data. Handle invalid JSON, missing files, write failures, and concurrent requests safely. Use a serialized write queue or equivalent mechanism to avoid conflicting writes. Validate data before saving and use atomic file replacement where appropriate.

## 7. Backend API Requirements

Build RESTful API endpoints using Express.js.

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Services
- `GET /api/services`
- `GET /api/services/:id`
- `POST /api/admin/services`
- `PUT /api/admin/services/:id`
- `DELETE /api/admin/services/:id`

### Customer Reservations
- `POST /api/reservations`
- `GET /api/reservations/my`
- `GET /api/reservations/:id`
- `PUT /api/reservations/:id`
- `PATCH /api/reservations/:id/cancel`

### Admin Reservations
- `GET /api/admin/reservations`
- `GET /api/admin/reservations/:id`
- `PATCH /api/admin/reservations/:id/status`

### Payments
- `POST /api/payments`
- `GET /api/payments/my`
- `GET /api/payments/:id`
- `GET /api/admin/payments`

### Customer and Dashboard Management
- `GET /api/admin/customers`
- `GET /api/admin/customers/:id`
- `PATCH /api/admin/customers/:id/status`
- `GET /api/admin/dashboard`
- `GET /api/customer/dashboard`

### Settings
- `GET /api/settings`
- `PUT /api/admin/settings`

Add additional endpoints if necessary. Apply correct HTTP status codes, request validation, authentication, role-based authorization, and consistent JSON responses.

Never expose admin endpoints to ordinary customers.

## 8. Suggested Folder Structure

Create a clean, modular project structure:

customer-reservation-system/
├── database/
│   ├── users.json
│   ├── services.json
│   ├── reservations.json
│   ├── payments.json
│   └── settings.json
├── public/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── services.html
│   ├── booking.html
│   ├── my-reservations.html
│   ├── reservation-details.html
│   ├── payments.html
│   ├── profile.html
│   ├── customer-dashboard.html
│   ├── admin/
│   │   ├── dashboard.html
│   │   ├── customers.html
│   │   ├── services.html
│   │   ├── reservations.html
│   │   ├── payments.html
│   │   └── settings.html
│   ├── css/
│   │   ├── style.css
│   │   ├── dashboard.css
│   │   └── responsive.css
│   ├── js/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── services.js
│   │   ├── booking.js
│   │   ├── reservations.js
│   │   ├── payments.js
│   │   ├── profile.js
│   │   └── admin/
│   │       ├── dashboard.js
│   │       ├── customers.js
│   │       ├── services.js
│   │       ├── reservations.js
│   │       ├── payments.js
│   │       └── settings.js
├── src/
│   ├── config/
│   │   └── session.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── reservationRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── customerRoutes.js
│   │   ├── adminRoutes.js
│   │   └── settingsRoutes.js
│   ├── controllers/
│   ├── services/
│   ├── utils/
│   │   ├── jsonDatabase.js
│   │   ├── idGenerator.js
│   │   └── validators.js
│   └── app.js
├── scripts/
│   └── seedDatabase.js
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── README.md

Adjust the structure when necessary, but keep frontend, routes, business logic, middleware, and data access separate.

## 9. Security and Validation

Implement:
- Password hashing.
- Session-based authentication.
- Server-side role checks.
- Input sanitization and validation.
- Duplicate account prevention.
- Protection against unauthorized record access.
- Secure session configuration.
- Rate limiting for login and registration.
- Appropriate security headers.
- Safe error messages without exposing stack traces.
- Validation of IDs, prices, quantities, and dates.
- Prevention of overbooking and conflicting reservations.
- Protection of JSON database files from direct public access.
- `.env` configuration for secrets.
- A `.gitignore` that excludes sensitive files and real session secrets.

The application must run only through the Node.js server. Do not instruct users to open HTML files directly or use a frontend-only development server as the production application.

## 10. Testing and Error Handling

Test the following workflows:

1. Register a new customer.
2. Log in and log out.
3. Prevent duplicate registration.
4. Browse and search services.
5. Check available dates and slots.
6. Make a valid reservation.
7. Reject a reservation for an unavailable slot.
8. Prevent overbooking.
9. Modify or cancel an eligible reservation.
10. Process a demo payment and generate a receipt.
11. Verify customer access restrictions.
12. Verify admin-only functionality.
13. Add, edit, and deactivate services.
14. Verify dashboard statistics against actual JSON records.
15. Restart the server and confirm data persistence.
16. Handle invalid input, missing records, and file-write errors.
17. Verify that one customer cannot access another customer's bookings.
18. Verify that concurrent booking requests cannot exceed service capacity.

Show useful error messages and ensure the application does not crash because of ordinary invalid requests.

## 11. Installation and Execution

Provide a complete `package.json` with all required dependencies and scripts.

Expected commands:

1. Install Node.js LTS.
2. Open the project folder in VS Code.
3. Run `npm install`.
4. Configure the environment variables using `.env.example`.
5. Run `npm run seed` to create an initial admin account and optional sample services.
6. Run `npm start` to start the application.
7. Open the local URL displayed by the server, such as `http://localhost:3000`.

The seed script must not overwrite existing user or reservation data. Generate a secure initial admin password through environment configuration or another safe setup mechanism, and document how to change it.

Include a README with installation instructions, environment configuration, database details, API overview, testing steps, and troubleshooting.

## 12. Final Deliverables

Generate the complete working project, including:
- All HTML pages.
- Complete CSS styling.
- Functional JavaScript.
- Node.js and Express.js backend.
- All API routes and controllers.
- JSON database utilities.
- Authentication and authorization.
- Customer and admin dashboards.
- Reservation and availability management.
- Payment records and demo payment workflow.
- Receipt printing.
- Input validation and error handling.
- Seed script.
- `.env.example`.
- `.gitignore`.
- Complete `package.json`.
- Documentation and setup instructions.

Do not provide only a UI prototype, pseudocode, partial code, or non-functional buttons. Implement all core features end-to-end and verify that the frontend, backend, and JSON database work together.

If a feature cannot be fully implemented, explicitly identify the limitation instead of presenting it as completed.

The final result must be a polished, functional, maintainable, and college-submission-ready Customer Reservation & Booking Management System using HTML, CSS, JavaScript, Node.js, Express.js, and a local JSON database.