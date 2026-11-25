# DEVELOPMENT PLAN — Hostel Management System

**System Architecture & Implementation Roadmap**

---

## 1. Executive Summary

The Hostel Management System is a university-grade accommodation management portal designed for student residential administration. It bridges student self-service capabilities (room allocation, leave pass generation with QR tokens, attendance roll call via real GPS geofencing & camera capture, mess billing, and maintenance grievances) with multi-role administrative oversight (Chief Warden, Gate Security, and Mess Management).

---

## 2. System Architecture

```
+-------------------------------------------------------------------------+
|                              FRONTEND                                   |
|   React 18.2 SPA + React Router v6 + Context API + Tailwind CSS         |
|   - Student Portal: Dashboard, Rooms, Gate Pass, Attendance, Mess       |
|   - Admin Portal: Superintendent Directory, Gate Terminal, Complaints   |
|   - QR Scanner (Html5QrcodeScanner) + Webcam Canvas Capture             |
+-------------------------------------------------------------------------+
                                    |
                            HTTP / REST / JWT
                                    |
+-------------------------------------------------------------------------+
|                          NODE.JS / EXPRESS BACKEND                      |
|   Port: 5000 | CORS Enabled | Express Validator | Multer File Storage   |
|                                                                         |
|   Routes:                                                               |
|   ├── /api/auth       (Student Signup, Login, Profile, JWT verification) |
|   ├── /api/admin_auth (Superintendent & Warden Role-based Login)         |
|   ├── /api/b          (Interactive Room Map, Allocation, Anti-Duplicate)|
|   ├── /api/g          (QR Gate Pass UUID Generation & Verification)      |
|   ├── /api/a          (Daily Roll Call, GPS Geofencing, Photo Uploads)   |
|   ├── /api/c          (Maintenance Ticket Logging & Student Self-Close)  |
|   ├── /api/f          (Hostel & Mess Constructive Student Feedback)      |
|   ├── /api/m          (Mess Billing, Balances, Payment Receipts)         |
|   ├── /api/ad         (Admin Directory, Live Capacity, Global Stats)     |
|   └── /api/ud         (Gate Security OUT/IN Stamping & Ticket Resolution)|
+-------------------------------------------------------------------------+
             |                                             |
             v                                             v
+------------------------+                    +---------------------------+
|    MONGODB DATABASE    |                    |  PYTHON MICROSERVICE      |
|   Port: 27017 / Atlas  |                    |  Port: 8085 (Flask)       |
|   Collections:         |                    |  - Live Face Detection    |
|   - users              |                    |  - 128D Embedding Match   |
|   - admins             |                    |  - MiniFASNet Anti-Spoof  |
|   - rooms              |                    |  - Physical Liveness Proof|
|   - attendances        |                    +---------------------------+
|   - gatepasses         |
|   - complains          |
|   - feedbacks          |
|   - messbills          |
+------------------------+
```

---

## 3. Database Schema Design

### 3.1 User Collection (`users`)
- `name`: Full Name (min 3 chars)
- `email`: Normalized unique college email
- `password`: Hashed with bcrypt (10 rounds)
- `mobile`: 10-digit primary phone
- `studentId`: Optional University enrollment number (unique)
- `course` / `department` / `academicYear`: Academic profile
- `guardianName` / `guardianPhone` / `relationship`: Emergency contacts
- `room_no`: Allocated room integer (0 = pending allocation)
- `photo_url`: Path to verified profile selfie
- `status`: `'approved'` | `'pending'` | `'rejected'`

### 3.2 Room Collection (`rooms`)
- `room_no`: 1-20 (Ground), 101-120 (1st Floor), 201-220 (2nd Floor)
- `floor`: `'ground'` | `'first'` | `'second'`
- `capacity`: 1 or 2 beds
- `occupiedBeds`: 0 or 1 (concurrency protected)
- `status`: `'available'` | `'occupied'` | `'maintenance'`
- `roomCharges`: ₹4500/semester

### 3.3 GatePass Collection (`gatepasses`)
- `user_id`: Reference to student
- `token_no`: Cryptographically unique UUID v4
- `Subject`: Destination purpose
- `It`: Expected return datetime
- `out_time`: Exit timestamp stamped by gate security
- `in_time`: Return timestamp stamped by gate security
- `pass_status`: `'issued'` -> `'out'` -> `'returned'`

### 3.4 Attendance Collection (`attendances`)
- `user_id`: Reference to student
- `latitude` / `longitude`: Captured device GPS coordinates
- `location_verified`: Haversine perimeter check within radius
- `face_verified`: Camera capture match
- `status`: `'Present'` | `'Absent'`
- `date`: Daily timestamp (unique per student per calendar day)

### 3.5 MessBill Collection (`messbills`)
- `user_id`: Reference to student
- `month`: Billing cycle (e.g., "November 2026")
- `totalAmount`: Monthly charge (₹6500)
- `usedAmount`: Spent amount (₹4200)
- `balance`: Remaining balance (₹2300)
- `status`: `'Paid'` | `'Pending'` | `'Overdue'`
- `paymentHistory`: Array of receipts, amounts, and dates

### 3.6 Complain Collection (`complains`)
- `user_id`: Reference to student
- `catagory`: `'Electricity'` | `'Plumbing'` | `'Wifi'` | `'Food'` | `'Room'` | `'Cleaning'` | `'Others'`
- `description`: Detailed issue report
- `status`: `'Pending'` | `'In Progress'` | `'Solved'` | `'Rejected'`
- `admin_remarks`: Resolution comments by hostel staff

---

## 4. Phase-by-Phase Execution Plan

1. **Phase 1: Project Audit & Dependency Mapping** (Completed)
   - Discovered missing `Backend/` folder.
   - Traced all 22 frontend API endpoints across `src/components/`.
2. **Phase 2: Backend Architecture & Database Reconstruction** (Completed)
   - Created Express 4.18 server with modular route handlers.
   - Built Mongoose 6 models with schema validation.
   - Created JWT authentication middleware for both students and admins.
3. **Phase 3: Database Seeding & Concurrency Controls** (Completed)
   - Initialized 60 physical hostel rooms across 3 floors.
   - Seeded Super Admin (`admin@hostel.edu`) and resident student (`rahul.mca@university.edu`).
   - Implemented duplicate booking prevention and duplicate roll-call prevention.
4. **Phase 4: Python Face Recognition & Anti-Spoofing** (Completed)
   - Fixed missing function imports and unbound variables in `python.py`.
   - Hardened anti-spoofing check to strictly reject fake/photo/screen attacks.
   - Added cross-origin support and safe relative model path resolution.
5. **Phase 5: Frontend Refinement & QR Camera Integration** (Completed)
   - Added live webcam QR Scanner using `html5-qrcode` on Gate Security console.
   - Removed hardcoded mess bill in `home.js` and connected to `/api/m/bill`.
   - Replaced hardcoded GPS coordinates in `attendance.js` with real device geolocation.
   - Added student ID and confirm password verification in `signup.js`.
6. **Phase 6: Verification & Quality Assurance** (Completed)
   - Executed automated API test suite covering all 20 critical workflows with 100% pass rate.
   - Verified frontend production build.
