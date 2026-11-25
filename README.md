# Smart Campus Hostel Management System

A university-grade, full-stack student accommodation and residential administration platform built with **React 18**, **Node.js / Express**, **MongoDB / Mongoose**, and **Python / Computer Vision**.

---

## 🌟 Key Modules & Capabilities

### 1. Student Portal
- **Secure Authentication**: Bcrypt password hashing and JWT token authorization.
- **Interactive Room Map**: Live occupancy across Ground, 1st, and 2nd floors with anti-duplicate booking prevention.
- **Mess Billing Management**: Real MongoDB mess ledger displaying monthly allowance (₹6,500), consumed balance, and payment receipts.
- **QR Gate Pass Generation**: Student-specific digital pass with UUID v4 token and downloadable PNG ticket.
- **Smart Campus Attendance**: Device GPS geofencing perimeter check and camera selfie verification.
- **Maintenance Tickets**: Multi-category grievance logging (electricity, water, wifi, cleanliness, etc.) with real-time status tracking.
- **Institutional Feedback**: Constructive suggestions submitted directly to the chief warden.

### 2. Administrative Console
- **Role-Based Access Control**: Separate privileges for Super Admin, Warden, Gate Security, and Mess Management.
- **Superintendent Directory**: Live overview of all 60 rooms, occupancy rates, and resident student profiles.
- **Gate Security Checkpoint**: **Integrated live camera QR barcode scanner** (`html5-qrcode`) for instant arrival and departure stamping.
- **Warden Roll Call Register**: Daily attendance tracking with location and face verification indicators.
- **Maintenance Redressal**: Queue management with status updates, resolution notes, and student notifications.
- **Live Analytics**: Real-time computed metrics from MongoDB (inside/outside campus counts, occupancy %, pending tickets).

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18.2, React Router v6, Tailwind CSS, Framer Motion, Lucide React, HTML5-QRCode |
| **Backend** | Node.js, Express.js 4.18, Express-Validator, Multer, UUID |
| **Database** | MongoDB (Local / Atlas), Mongoose 6 |
| **Authentication** | JSON Web Tokens (JWT), Bcrypt (10 salt rounds) |
| **Computer Vision** | Python Flask, OpenCV, face_recognition, MiniFASNet anti-spoofing |

---

## 🚀 Quick Start Guide (Windows)

### Prerequisites
- **Node.js** v18+ or v22+
- **MongoDB** running locally on port 27017 or MongoDB Atlas connection string

### Step 1: Install Dependencies
Open PowerShell in the project directory:
```powershell
npm install --legacy-peer-deps
```

### Step 2: Configure Environment Variables
Copy the template files:
```powershell
copy .env.example .env
copy Backend\.env.example Backend\.env
```
Default configuration points to local MongoDB (`mongodb://127.0.0.1:27017/hosteldb`) and backend port 5000.

### Step 3: Seed Database with Initial Data
Run the automated database seeder to initialize all 60 rooms, demo student, and admin accounts:
```powershell
node Backend/seed.js
```

### Step 4: Start the Backend Server
```powershell
node Backend/index.js
# Or using npm script:
# npm run backend
```
Backend will start on `http://localhost:5000`. Test health at `http://localhost:5000/api/health`.

### Step 5: Start the React Frontend
In a second terminal window:
```powershell
npm start
```
Frontend will open on `http://localhost:3000`.

---

## 🔑 Demo Credentials (Pre-Seeded)

| Portal | Email | Password | Role / Details |
|---|---|---|---|
| **Resident Student** | `rahul.mca@university.edu` | `Password123` | Room 101, Active Mess Balance |
| **Superintendent / Warden** | `admin@hostel.edu` | `AdminPassword123` | Full Administrative Privileges |

*Note: Signin pages include convenient "Auto-fill Demo Credentials" buttons for fast presentation testing.*

---

## 🧪 Running Automated Tests

Run the comprehensive end-to-end integration test suite:
```powershell
node Backend/tests/api.test.js
```
This tests all 20 critical flows (registration, duplicate checks, room booking, QR pass issuance, gate security timestamps, attendance, complaint resolution, mess billing, and analytics).

---

## 🐍 Python Face Recognition Service (Optional)

The backend includes native support for real-time face verification and anti-spoof physical liveness detection:
```powershell
cd Python
pip install -r requirements.txt
python python.py
```
Runs on `http://localhost:8085`. If the Python microservice is offline, the backend gracefully falls back to camera capture logging without blocking the demo.

---

## 📂 Project Directory Structure

```
Hostel-main/
├── Backend/
│   ├── index.js             # Main Express server entry point
│   ├── db.js                # MongoDB connection handler
│   ├── seed.js              # Initial database population script
│   ├── .env                 # Backend environment secrets
│   ├── .env.example         # Environment variable template
│   ├── models/              # Mongoose database models
│   │   ├── User.js          # Student resident model
│   │   ├── Admin.js         # Administrative roles model
│   │   ├── Room.js          # Physical room allocation model
│   │   ├── MessBill.js      # Mess ledger & receipts model
│   │   ├── GatePass.js      # QR token movement model
│   │   ├── Attendance.js    # GPS & face attendance model
│   │   ├── Complain.js      # Maintenance grievances model
│   │   └── Feedback.js      # Institutional reviews model
│   ├── routes/              # Express REST API endpoints
│   ├── middleware/          # JWT auth guards (fetchuser, fetchadmin)
│   └── tests/
│       └── api.test.js      # 20-point automated integration test suite
├── Python/
│   ├── python.py            # Flask face verification microservice
│   └── test.py              # MiniFASNet anti-spoof predictor
├── src/
│   ├── App.js               # React Router navigation tree
│   ├── components/          # Portal pages and widgets
│   │   ├── home.js          # Student dashboard & interactive room map
│   │   ├── adminhome.js     # Admin resident directory & capacity stats
│   │   ├── adminpasses.js   # Gate security terminal + Live QR camera scanner
│   │   ├── attendance.js    # Smart GPS roll call + selfie camera
│   │   ├── vichla.js        # Gate pass generation + digital ticket download
│   │   └── complains.js     # Maintenance grievances desk
│   └── context/             # Global application state (NoteState)
└── package.json             # Root dependencies & scripts
```

---

## 🎓 Viva & Presentation Guidance (MCA Project)

1. **Why JWT over session cookies?**
   - Stateless authentication allows horizontal scaling, eliminates server session memory overhead, and allows clean microservice integration (e.g., Python face service or mobile client).
2. **How is duplicate room booking prevented?**
   - The `/api/b/bookroom` endpoint checks both the student's existing room status and queries MongoDB for any conflicting occupant before updating the room record, preventing race conditions.
3. **How does the QR Gate Pass prevent forgery?**
   - The QR code contains only a cryptographically unique UUID token (`token_no`). All student identity, date validity, and movement timestamps are validated and recorded on the server.
4. **How is anti-spoofing enforced?**
   - The Python microservice uses a convolutional MiniFASNet network that analyzes facial textures and Fourier frequency domains to distinguish between a real 3D human face versus a printed photo or digital screen attack.