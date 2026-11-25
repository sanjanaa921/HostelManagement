# CHANGELOG — Hostel Management System

All notable changes and architectural improvements made to this repository are documented below.

---

## [2.1.0] - 2026-11-25

### 🏛️ Gender-Based Boys & Girls Hostel Separation (Task 1)
- **Schema & Database Updates**:
  - Added required `gender` ('Male' | 'Female') and `hostel` ('boys' | 'girls') to `User` schema.
  - Implemented automatic hostel assignment: `Male` → `boys`, `Female` → `girls`.
  - Added compound uniqueness on `Room.js` `(hostel, room_no)`: 60 rooms in Boys Hostel (Mega Boys Block A) + 60 rooms in Girls Hostel (Kaveri Girls Block A).
  - Added `hostel` to `Attendance`, `Complain`, `GatePass`, `Feedback`, and `MessBill` models.
- **API Authorization & Separation**:
  - `GET /api/b/hostelrooms`: Automatically scoped to student's registered hostel.
  - `POST /api/b/book`: Strict validation preventing cross-hostel room booking (returns 403 Forbidden).
  - `PATCH /api/ad/correctgender/:userId`: Admin gender correction with automatic hostel migration and safe previous room deallocation.
  - `fetchadmin` / `resolveHostelAccess`: Enforces warden hostel restrictions while allowing superadmins full access with `?hostel=boys|girls|all`.

### ⏱️ Attendance & Grievance Redressal Audit & Fix (Task 2)
- **Smart Attendance Module**:
  - Connected `POST /api/at/mark` with strict campus geofencing (Parul University Goa Campus `15.3911, 73.8782`, 500m radius).
  - Enforced that GPS verification cannot silently pass when location coordinates are unavailable (`location_verified: false`).
  - Face verification strictly gated on anti-spoofing liveness verification.
  - `GET /api/at/studenthistory` and `GET /api/at/campus-config` fully wired.
- **Complaint Management Module**:
  - Fixed student complaint registration with automatic hostel tagging.
  - Added student self-solve (`PATCH /api/c/studentsolve/:id`) and student delete (`DELETE /api/c/studentdelete/:id`).
  - Added admin status update with warden remarks (`PATCH /api/c/updatecomplain/:id`).
  - Connected admin complaints desk with live hostel filter tabs and search.

### 🍽️ Feedback & Mess Bill Management Audit & Fix (Task 3)
- **Student Feedback Module**:
  - Enhanced `Feedback.js` model with `hostel` and `studentId`.
  - Added `GET /api/f/feedback` allowing students to view their personal submission history with live status updates.
  - Built `adminfeedback.js` Admin Feedback Desk with KPI metrics, Boys/Girls hostel filter tabs, search, and detail modal.
  - Connected feedback submission on `temp.js` to eliminate false redirection when room number is not pre-cached.
- **Mess Bill Management**:
  - Added `studentId` to `MessBill.js` model.
  - Enhanced `GET /api/m/bill` to return complete allowance breakdown, remaining balance, status badge (`Paid`, `Pending`, `Overdue`), and latest payment receipt.
  - Implemented `GET /api/m/bills` with warden hostel filtering (`?hostel=boys|girls|all`).
  - Implemented `POST /api/m/generate` to issue monthly student bills.
  - Implemented `POST /api/m/payment` to record payments, recalculate balances, and flip status to `Paid` upon complete settlement.
  - Implemented `PATCH /api/m/billstatus` for direct administrative status adjustments.
  - Built `adminmess.js` Admin Mess Desk with KPI cards, resident picker, monthly bill generation modal, and payment recording modal.
  - Added navigation links to `adminsidebar.js` and registered routes in `App.js`.
  - Backfilled legacy database records to ensure 100% hostel field coverage across collections.

---

## [2.0.0] - 2026-11-24

### 🚀 Major Architectural Recovery & New Backend Implementation
- **Full Backend Reconstruction**: Designed and implemented the complete Node.js/Express.js backend (`Backend/`) from scratch based on frontend API contracts.
- **MongoDB Database Models**: Created 8 production-grade Mongoose models:
  - `User.js`: Full student profile, academic information, emergency contact, hashed password, room number, status.
  - `Admin.js`: Role-based authentication (Super Admin, Warden, Gate Security, Mess Manager).
  - `Room.js`: Physical room tracking across Ground, 1st, and 2nd floors with capacity and occupancy concurrency control.
  - `MessBill.js`: Actual mess billing tracking monthly total, used amount, balance, due dates, and receipts.
  - `GatePass.js`: Unique UUID v4 tokenized gate passes tracking departure and arrival timestamps.
  - `Attendance.js`: Roll-call records with GPS coordinates, geofence radius check, and face verification status.
  - `Complain.js`: Multi-category maintenance tickets with resolution history and admin remarks.
  - `Feedback.js`: Separate student feedback mechanism for mess and amenities.
- **RESTful API Routes**: Implemented and mounted 22 endpoints across 9 route files:
  - `/api/auth`: Student signup, login, profile retrieval, profile updates.
  - `/api/admin_auth`: Secure superintendent login and JWT generation.
  - `/api/b`: Booked room listing and concurrency-checked room allocation.
  - `/api/g`: Gate pass issuance and active token checking.
  - `/api/a`: Daily roll-call attendance with GPS geofencing and photo uploads.
  - `/api/c`: Complaint registration, student self-resolution, ticket deletion.
  - `/api/f`: Student feedback submission.
  - `/api/m`: Student mess balance retrieval, monthly bill generation, payment recording.
  - `/api/ad`: Superintendent directory, attendance register, dashboard metrics.
  - `/api/ud`: Gate security departure/arrival stamping and ticket resolution.
- **Database Seeder (`Backend/seed.js`)**: Created automated seed script initializing 60 rooms, default Super Admin (`admin@hostel.edu`), and resident student (`rahul.mca@university.edu`).

### 🛡️ Security & Authentication Hardening
- **Password Protection**: Hashed all passwords using `bcrypt` (10 salt rounds).
- **JWT Protection**: Implemented `fetchuser` and `fetchadmin` middleware enforcing token authentication.
- **Duplicate Prevention**:
  - Prevented duplicate student email registrations.
  - Prevented duplicate room bookings (ensuring rooms cannot be double-booked).
  - Prevented multiple active gate passes on the same day.
  - Prevented duplicate daily roll-call attendance entries for the same student.
- **Input Sanitization**: Path traversal protection for file uploads (`path.basename`).

### 🐍 Python Face Recognition & Anti-Spoofing Service
- **Import Bug Fixes**: Fixed undefined `checking` call in `python.py`.
- **CORS Support**: Added cross-origin request headers to Flask microservice.
- **HTTP Methods**: Enabled both `GET` and `POST` methods with JSON body support on `/check`.
- **Anti-Spoofing Enforcement**: Hardened verification so physical presence (`gspoof == 1`) is strictly required. Fake, photo, or screen attacks are rejected even if facial features match.
- **Path Portability**: Converted all model and caffe net paths to dynamic absolute paths using `os.path.dirname(__file__)`.
- **Dependency Cleanup**: Replaced broken local file:// conda paths in `requirements.txt` with standard PyPI packages.

### 💻 Frontend Enhancements
- **Live Camera QR Scanner**: Added real-time webcam QR scanning using `html5-qrcode` to `adminpasses.js` for security gate guards.
- **Real Mess Billing Connection**: Connected `home.js` mess widget to `/api/m/bill` instead of static hardcoded values.
- **Real GPS Location Capture**: Removed hardcoded fallback coordinates from `attendance.js` and integrated real device geolocation with error handling for denied permissions.
- **Registration Form Validation**: Added password confirmation matching and Student ID input to `signup.js`.

### 🧪 Automated Testing
- **End-to-End Test Suite (`Backend/tests/api.test.js`)**: Created and ran 20 automated tests covering all critical flows. Result: **20/20 passed (100%)**.
- **Production Frontend Build**: Successfully ran `npm run build` with 0 compile errors.
