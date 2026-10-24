# 🎯 ReserveEase - Customer Reservation & Booking Management System

> **Academic Submission**: Master of Computer Applications (MCA) Project  
> **Architecture**: Dual-Port Full-Stack Web Application (Node.js, Express, Local JSON DB, Responsive Vanilla CSS, Chart.js)  
> **Status**: ✅ Production Ready & Fully Tested

---

## ⚡ Quick Access & Default Credentials

The application runs on a **Dual-Port Architecture** separating the Administrator and Customer experiences:

| Portal | URL | Default Email | Default Password | Role & Permissions |
| :--- | :--- | :--- | :--- | :--- |
| 🛡️ **Administrator Portal** | [http://localhost:3000](http://localhost:3000) | `admin@reservations.com` | `Admin@123` | Full administrative control: KPI analytics, service management, reservation approvals/cancellations, customer management, payment audit trail, system settings. |
| 👤 **Customer Portal** | [http://localhost:3030](http://localhost:3030) | `customer@example.com`<br>*(or `prathameshgiri8607@gmail.com`)* | `Customer@123` | Customer self-service: browse services, live slot availability, booking creation, payment simulation, printable receipts, reservation cancellation, profile management. |

> 💡 **New Customer Registration**: Anyone can register a new account instantly via the Customer Portal at [http://localhost:3030/register.html](http://localhost:3030/register.html).

---

## 🚀 How to Run the Application (Step-by-Step Guide)

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18.x or v20.x or later recommended) — [Download Node.js](https://nodejs.org/)
- **npm** (comes bundled with Node.js)
- Modern web browser (Google Chrome, Microsoft Edge, Firefox, Brave)

---

### 2. Open Terminal / Command Prompt
Open your terminal (PowerShell, Command Prompt, or VS Code Terminal) in this project directory:

```bash
cd "d:/Workspaces/College Projects/Rohit w/customer-reservation-system"
```

---

### 3. Install Dependencies
Install all required Node.js packages:

```bash
npm install
```

This installs:
- `express` — Web framework
- `express-session` — Secure cookie-based session management
- `bcryptjs` — Salted password hashing
- `express-validator` — Server-side input validation and sanitization
- `helmet` & `cors` — HTTP security headers and CORS policies
- `dotenv` — Environment variable management
- `uuid` — Unique identifier generation

---

### 4. Seed the Database (Initial Setup)
Initialize the local JSON database with default accounts, branding settings, and sample services:

```bash
npm run seed
```

**What this command does**:
- Creates `database/` folder with initialized JSON files: `users.json`, `services.json`, `reservations.json`, `payments.json`, and `settings.json`.
- Seeds the default **Admin Account** (`admin@reservations.com` / `Admin@123`).
- Seeds the default **Demo Customer Account** (`customer@example.com` / `Customer@123`).
- Seeds 8 diverse sample services (Luxury Spa, Fine Dining, Conference Rooms, Yoga, Swimming Pool, Movie Screening, Photography Studio, Banquet Hall).

---

### 5. Start the Server
Start the dual-port application server:

```bash
npm start
```

*(You can also run `npm run dev`)*

You will see the following confirmation banner in your terminal:

```text
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        🎯  ReserveEase - Dual-Port Reservation System        ║
║                                                              ║
║   🛡️  ADMIN PORT (3000):    http://localhost:3000            ║
║   👤  CUSTOMER PORT (3030): http://localhost:3030            ║
║                                                              ║
║   Admin Login:     admin@reservations.com / Admin@123        ║
║   Customer Login:  customer@example.com / Customer@123       ║
║   Database:        ./database/ (Local JSON Database)         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

### 6. Access in Your Browser
Open your browser and navigate to:
- **Admin Portal**: [http://localhost:3000](http://localhost:3000)
- **Customer Portal**: [http://localhost:3030](http://localhost:3030)

> ⚠️ **Browser Note**: If you previously had the application open in your browser, press **`Ctrl + F5`** (Hard Refresh) to clear cached CSS styles and load the latest responsive layout.

---

## 🌟 Application Features & Modules

### 👤 1. Customer Module (`http://localhost:3030`)
- **Landing Page (`/index.html`)**: Modern hero section, featured service carousel, customer testimonials, and direct booking call-to-actions.
- **Authentication (`/login.html`, `/register.html`)**:
  - Secure registration with client and server-side validation (Full Name, Email, 10-digit Mobile, Strong Password).
  - Password hashing with salted BCrypt rounds.
  - Role-based automatic redirection (Admin → Port 3000, Customer → Port 3030).
- **Customer Dashboard (`/customer-dashboard.html`)**:
  - Live metric counters for **Total Bookings**, **Upcoming**, **Completed**, and **Cancelled**.
  - Quick action buttons to book new services or review reservations.
  - Recent reservations table with live status badges.
- **Browse & Search Services (`/services.html`)**:
  - Live search by service name or description.
  - Category filtering (Spa & Wellness, Dining, Business, Entertainment, Recreation, Creative, Events).
  - Real-time capacity and pricing tags.
- **Reservation Booking Flow (`/booking.html`)**:
  - Service selection with auto-filled duration, price, and capacity.
  - Date picker with dynamic slot availability calculation.
  - Slot selection showing remaining seats in real time.
  - Pax quantity counter with automatic price recalculation (`Total = Price × Quantity`).
  - Special instructions text area.
- **My Reservations (`/my-reservations.html`)**:
  - Clean data table listing all customer bookings (`Booking ID`, `Service`, `Date`, `Time`, `Qty`, `Amount`, `Status`, `Payment`).
  - **Cancellation System**: Customers can self-cancel `Pending` or `Confirmed` bookings with single-click confirmation.
- **Booking Details & Payment Simulation (`/reservation-details.html`)**:
  - Full booking breakdown, unit prices, time slot, and customer details.
  - Interactive **Simulated Payment Gateway**:
    - **UPI**: QR Code simulation & UPI ID input.
    - **Card**: Credit/Debit card form with validation.
    - **Cash**: Pay at counter option.
- **Payment History & Receipts (`/payments.html`)**:
  - Complete transaction ledger with payment references (e.g., `PAY-2026-0001`).
  - Clean, professional **Printable Invoice / Receipt** modal with browser print styling (`window.print()`).
- **Profile Management (`/profile.html`)**:
  - View account details and registration timestamp.
  - Update personal contact details (Name & Phone).
  - Change password with current password verification.

---

### 🛡️ 2. Administrator Module (`http://localhost:3000`)
- **Executive Analytics Dashboard (`/admin/dashboard.html`)**:
  - KPI summary metric cards: **Total Revenue (₹)**, **Total Bookings**, **Today's Bookings**, **Active Customers**.
  - Monthly revenue & booking trend chart (**Chart.js Line & Bar Graph**).
  - Reservation status distribution chart (**Chart.js Doughnut Chart**).
  - Recent bookings live feed.
- **Reservation Master Records (`/admin/reservations.html`)**:
  - Master reservation table with search by Booking ID, customer name, or email.
  - Multi-criteria filter toolbar: Status (`Pending`, `Confirmed`, `Completed`, `Cancelled`), Payment (`Paid`, `Pending`), and Date.
  - **Quick Action Triggers**:
    - `[👁 View Details]`: Opens full modal with customer contacts, service schedules, unit price calculations, special instructions, and quick action buttons.
    - `[✓ Confirm]`: Confirms a pending reservation and notifies customer immediately.
    - `[🏁 Complete]`: Marks an active reservation as completed.
    - `[⊘ Cancel]`: Prompts for a mandatory cancellation reason (e.g., schedule conflict, customer request, maintenance) and updates database.
- **Service & Slot Management (`/admin/services.html`)**:
  - CRUD operations: Add new service, edit existing service details, pricing, max capacity per slot, and active time slots.
  - Toggle service status (`Active` / `Inactive`).
  - Deletion protection: Prevents deleting services with active reservations to maintain relational integrity.
- **Customer Account Management (`/admin/customers.html`)**:
  - Complete list of registered users with phone, email, and joined date.
  - Individual customer profile inspection: Total bookings, total spend, and reservation history table.
  - Account status toggle (`Active` / `Deactivated`).
- **Payment & Audit Trail (`/admin/payments.html`)**:
  - Central ledger of all simulated customer transactions.
  - Filter by payment status (`Paid`, `Pending`, `Refunded`, `Failed`) and method (`UPI`, `Card`, `Cash`).
  - Transaction reference search.
  - Audit trail viewer showing adjustments, timestamps, and payment notes.
- **Global System Settings (`/admin/settings.html`)**:
  - Configure application name, support email, contact number, and currency symbol (`₹`).
  - Configure cancellation policy lead times (e.g., minimum 24 hours prior).
  - Toggle enabled payment methods (UPI, Cards, Cash).

---

## 📱 Responsive Design & Cross-Device Compatibility

The application is engineered with a **custom responsive CSS system** (`style.css` + `responsive.css` + `dashboard.css`) that adapts dynamically across:
1. **Laptops & Desktops (1025px - 1920px)**:
   - Full sidebar layout with smooth collapse toggle (`.sidebar.collapsed`).
   - Clean, unclipped data tables with proportional column spacing.
   - Pinned top headers with zero right-side clipping.
2. **Tablets (769px - 1024px)**:
   - Sidebar automatically hides off-screen as a slide-out drawer with a backdrop overlay.
   - Accessible via the top-left hamburger toggle button (`#sidebarToggle`).
   - Full 100% viewport width allocated to page content and tables.
3. **Mobile Phones (320px - 768px)**:
   - Toolbar filters stack cleanly into full-width elements.
   - Data tables support smooth horizontal scrolling inside dedicated card containers without breaking page dimensions.
   - Modals and forms fit within mobile screen bounds.

---

## 🔄 Cross-Portal Live Synchronization

The system demonstrates **instant cross-portal data reflection**:
1. When an Admin updates a reservation from `Pending` → `Confirmed` or `Cancelled` on **Port 3000**:
   - The centralized JSON database (`database/reservations.json`) is atomically updated.
2. When the Customer opens or refreshes **Port 3030**:
   - The booking badge immediately displays the new status (`Confirmed` / `Cancelled`).
   - The Customer Dashboard's upcoming booking counter automatically recalculates.

---

## 📂 Project Architecture & Directory Structure

```text
customer-reservation-system/
├── database/                    # Thread-safe local JSON database
│   ├── users.json               # User accounts & BCrypt password hashes
│   ├── services.json            # Services, pricing, capacities, time slots
│   ├── reservations.json        # Booking records, dates, statuses
│   ├── payments.json            # Payment records & transaction references
│   └── settings.json            # Global branding & system settings
├── public/                      # Static client frontend
│   ├── index.html               # Public landing page
│   ├── login.html               # Unified authentication login
│   ├── register.html            # Customer registration
│   ├── customer-dashboard.html  # Customer overview dashboard
│   ├── services.html            # Service catalog & search
│   ├── booking.html             # Real-time slot booking form
│   ├── my-reservations.html     # Customer bookings list
│   ├── reservation-details.html # Booking invoice & demo payment
│   ├── payments.html            # Payment ledger & printable receipts
│   ├── profile.html             # Profile & password settings
│   ├── admin/                   # Administrative portal
│   │   ├── dashboard.html       # Executive KPI & Chart.js analytics
│   │   ├── reservations.html    # Reservation master approvals & cancel
│   │   ├── services.html        # Service CRUD & slot control
│   │   ├── customers.html       # Customer list & activity inspector
│   │   ├── payments.html        # Payment ledger & audit trail
│   │   └── settings.html        # Global system configuration
│   ├── css/
│   │   ├── style.css            # Core design system, variables & components
│   │   ├── dashboard.css        # Charts, toolbars & table styling
│   │   └── responsive.css       # Mobile & tablet media queries
│   └── js/
│       ├── api.js               # Centralized Fetch API client & dialogs
│       └── auth.js              # Session checker & responsive sidebar logic
├── scripts/
│   └── seedDatabase.js          # Database initializer & sample data seeder
├── src/                         # Server-side application logic
│   ├── app.js                   # Express application setup & middleware
│   ├── config/session.js        # Session cookie security configuration
│   ├── middleware/              # Auth, role-based access, error handlers
│   ├── routes/                  # RESTful API route controllers
│   └── utils/                   # JSON DB engine, ID generator, validators
├── .env                         # Local environment configuration
├── .env.example                 # Environment configuration template
├── package.json                 # Project dependencies & npm scripts
├── server.js                    # Dual-Port server launcher (3000 & 3030)
└── README.md                    # Project documentation
```

---

## 🔒 Security & Data Integrity Highlights

- **Salted Password Hashing**: Passwords are never stored in plaintext; hashed using `bcryptjs` with 10 salt rounds.
- **Session Security**: Session cookies configured with `HttpOnly`, `SameSite: 'lax'`, and anti-tampering session secrets.
- **Role-Based Authorization**: Middleware rigorously verifies user roles (`admin` vs `customer`) on all `/api/admin/*` endpoints.
- **Race Condition Prevention**: The JSON database engine utilizes a **serialized write queue** with atomic temporary file swapping (`fs.renameSync`) to eliminate data corruption during concurrent bookings.
- **Input Sanitization**: Express-validator cleanses and validates all incoming payloads (dates, emails, phone numbers, quantities).
- **Directory Protection**: Direct HTTP access to the `/database` directory is strictly blocked.

---

## 🛠️ Common Troubleshooting & FAQs

### Q1: "Port 3000 or Port 3030 is already in use"
If another process is using port 3000 or 3030 on your machine:
- **On Windows (PowerShell)**:
  ```powershell
  # Find process using port 3000 or 3030:
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3030).OwningProcess | Stop-Process -Force
  ```
- Or change the ports in `.env`:
  ```env
  ADMIN_PORT=3001
  CUSTOMER_PORT=3031
  ```

### Q2: "Styling looks cut off or old styles are visible"
Browsers aggressively cache CSS files. To see the updated responsive styles:
- Press **`Ctrl + F5`** (Windows) or **`Cmd + Shift + R`** (Mac) in your browser.

### Q3: "How to reset the database to fresh sample data?"
Simply delete the files in `database/*.json` (or edit them) and run:
```bash
npm run seed
```

---

## 🎓 College Submission Information

- **Project Title**: Customer Reservation & Booking Management System (ReserveEase)
- **Academic Degree**: Master of Computer Applications (MCA)
- **Course**: Final Year Project Submission
- **Year**: 2026
- **Architecture**: Dual-Port Node.js Full-Stack Architecture with Local JSON Database
