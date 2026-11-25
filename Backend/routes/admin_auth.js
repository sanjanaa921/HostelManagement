const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');

const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || 'hostel_admin_jwt_secret_dev_key_2024';
const SALT_ROUNDS = 10;

/**
 * POST /api/admin_auth/adminlogin
 * Admin / Warden / Gate Security / Mess Manager login
 * Public endpoint (but limited to pre-created admin accounts)
 */
router.post(
  '/adminlogin',
  [
    body('email', 'Please provide a valid email address').isEmail().normalizeEmail(),
    body('password', 'Password cannot be empty').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        response: false,
        message: errors.array()[0].msg
      });
    }

    const { email, password } = req.body;

    try {
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(401).json({
          response: false,
          message: 'Invalid admin credentials. This portal is for authorized personnel only.'
        });
      }

      const passwordMatch = await bcrypt.compare(password, admin.password);
      if (!passwordMatch) {
        return res.status(401).json({
          response: false,
          message: 'Invalid admin credentials. Access denied.'
        });
      }

      const payload = {
        admin: {
          id: admin.id,
          email: admin.email,
          role: admin.role
        }
      };

      const jwtData = jwt.sign(payload, JWT_ADMIN_SECRET, { expiresIn: '12h' });

      return res.json({
        response: true,
        message: `Welcome, ${admin.name}! Signed in as ${admin.role}.`,
        jwtData,
        role: admin.role,
        name: admin.name
      });

    } catch (err) {
      console.error('Error in adminlogin:', err.message);
      return res.status(500).json({
        response: false,
        message: 'Internal server error.'
      });
    }
  }
);

/**
 * POST /api/admin_auth/createadmin
 * Create initial admin account (should be disabled in production after setup)
 * This endpoint is only available when ALLOW_ADMIN_CREATION=true in env
 */
router.post('/createadmin', async (req, res) => {
  if (process.env.ALLOW_ADMIN_CREATION !== 'true') {
    return res.status(403).json({
      response: false,
      message: 'Admin account creation is disabled. Contact the system administrator.'
    });
  }

  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ response: false, message: 'Name, email and password are required.' });
  }

  try {
    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ response: false, message: 'Admin with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'warden'
    });

    return res.status(201).json({
      response: true,
      message: `Admin account created successfully with role: ${admin.role}`
    });
  } catch (err) {
    console.error('Error in createadmin:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

module.exports = router;
