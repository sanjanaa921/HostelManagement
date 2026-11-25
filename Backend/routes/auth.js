const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const fetchuser = require('../middleware/fetchuser');

const JWT_SECRET = process.env.JWT_SECRET || 'hostel_jwt_secret_dev_key_2024';
const SALT_ROUNDS = 10;

/**
 * POST /api/auth/createuser
 * Register a new student account
 * Public endpoint
 */
router.post(
  '/createuser',
  [
    body('name', 'Full name must be at least 3 characters').isLength({ min: 3 }).trim(),
    body('email', 'Please provide a valid email address').isEmail().normalizeEmail(),
    body('password', 'Password must be at least 5 characters').isLength({ min: 5 }),
    body('mobile', 'Mobile number must be at least 10 digits').isLength({ min: 10 }),
    body('gender', 'Gender is required and must be either Male or Female').isIn(['Male', 'Female'])
  ],
  async (req, res) => {
    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        response: false,
        message: errors.array()[0].msg
      });
    }

    const {
      name,
      email,
      password,
      mobile,
      studentId,
      gender,
      course,
      department,
      academicYear,
      guardianName,
      guardianPhone,
      relationship
    } = req.body;

    try {
      // Check if student already exists by email
      let existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          response: false,
          message: 'An account with this email already exists. Please sign in instead.'
        });
      }

      // If studentId provided, check uniqueness
      if (studentId) {
        let existingId = await User.findOne({ studentId });
        if (existingId) {
          return res.status(400).json({
            response: false,
            message: 'A student with this Student ID / Enrollment Number already exists.'
          });
        }
      }

      // Hash password securely
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Automatic Hostel Assignment based strictly on verified gender
      const assignedHostel = gender === 'Female' ? 'girls' : 'boys';

      // Create the new student
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        mobile,
        studentId: studentId || '',
        gender,
        hostel: assignedHostel,
        course: course || 'MCA',
        department: department || 'Computer Applications',
        academicYear: academicYear || '1st Year',
        guardianName: guardianName || '',
        guardianPhone: guardianPhone || '',
        relationship: relationship || 'Parent',
        room_no: 0,
        status: 'approved'
      });

      return res.status(201).json({
        response: true,
        message: 'Account created successfully! You can now sign in.'
      });

    } catch (err) {
      console.error('Error in createuser:', err.message);
      return res.status(500).json({
        response: false,
        message: 'Internal server error. Please try again later.'
      });
    }
  }
);

/**
 * POST /api/auth/login
 * Student login
 * Public endpoint
 */
router.post(
  '/login',
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
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          response: false,
          message: 'Invalid email or password. Please check your credentials.'
        });
      }

      // Compare passwords
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({
          response: false,
          message: 'Invalid email or password. Please check your credentials.'
        });
      }

      // Check account status
      if (user.status === 'rejected') {
        return res.status(403).json({
          response: false,
          message: 'Your account has been rejected. Please contact the hostel warden.'
        });
      }

      if (user.status === 'pending') {
        return res.status(403).json({
          response: false,
          message: 'Your account is pending approval. Please wait for warden authorization.'
        });
      }

      // Generate JWT token
      const payload = {
        user: {
          id: user.id,
          email: user.email,
          gender: user.gender,
          hostel: user.hostel
        }
      };

      const jwtData = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

      return res.json({
        response: true,
        message: 'Login successful! Welcome back.',
        jwtData,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          gender: user.gender,
          hostel: user.hostel,
          room_no: user.room_no
        }
      });

    } catch (err) {
      console.error('Error in login:', err.message);
      return res.status(500).json({
        response: false,
        message: 'Internal server error. Please try again later.'
      });
    }
  }
);

/**
 * GET /api/auth/getuser
 * Get the authenticated student's details
 * Protected endpoint
 */
router.get('/getuser', fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        response: false,
        message: 'User not found.'
      });
    }

    return res.json({
      response: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        studentId: user.studentId,
        gender: user.gender,
        hostel: user.hostel,
        course: user.course,
        department: user.department,
        academicYear: user.academicYear,
        guardianName: user.guardianName,
        guardianPhone: user.guardianPhone,
        relationship: user.relationship,
        photo_url: user.photo_url,
        status: user.status,
        date: user.date
      },
      room_no: user.room_no || null,
      hostel: user.hostel || 'boys'
    });

  } catch (err) {
    console.error('Error in getuser:', err.message);
    return res.status(500).json({
      response: false,
      message: 'Internal server error.'
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update student profile permitted details
 * Protected: Student
 * Note: Students CANNOT alter gender or hostel assignment.
 * Only administrators can correct student gender.
 */
router.put('/profile', fetchuser, async (req, res) => {
  const {
    name,
    mobile,
    course,
    department,
    academicYear,
    guardianName,
    guardianPhone,
    relationship
  } = req.body;

  try {
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (mobile) updateData.mobile = mobile;
    if (course) updateData.course = course;
    if (department) updateData.department = department;
    if (academicYear) updateData.academicYear = academicYear;
    if (guardianName) updateData.guardianName = guardianName;
    if (guardianPhone) updateData.guardianPhone = guardianPhone;
    if (relationship) updateData.relationship = relationship;

    // Explicitly reject any attempt by a student to change their gender or hostel
    if (req.body.gender || req.body.hostel) {
      // Intentionally stripped out: students cannot self-change gender or hostel assignment
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');

    return res.json({
      response: true,
      message: 'Profile updated successfully.',
      user
    });

  } catch (err) {
    console.error('Error in profile update:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

module.exports = router;
