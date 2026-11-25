require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectToMongo = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// ========================
// Connect to MongoDB
// ========================
connectToMongo();

// ========================
// Middleware
// ========================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'auth-token', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========================
// API Routes
// ========================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin_auth', require('./routes/admin_auth'));
app.use('/api/b', require('./routes/booking'));
app.use('/api/a', require('./routes/attendance'));
app.use('/api/g', require('./routes/gatepass'));
app.use('/api/c', require('./routes/complain'));
app.use('/api/f', require('./routes/feedback'));
app.use('/api/m', require('./routes/mess'));
app.use('/api/ad', require('./routes/admin'));
app.use('/api/ud', require('./routes/update'));

// ========================
// Health Check Endpoint
// ========================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Hostel Management System Backend',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// ========================
// 404 Handler
// ========================
app.use((req, res) => {
  res.status(404).json({
    response: false,
    message: `Route ${req.method} ${req.url} not found.`
  });
});

// ========================
// Global Error Handler
// ========================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({
    response: false,
    message: 'An unexpected server error occurred.'
  });
});

// ========================
// Start Server
// ========================
app.listen(PORT, () => {
  console.log(`\n🚀 Hostel Management Backend running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hosteldb'}\n`);
});

module.exports = app;
