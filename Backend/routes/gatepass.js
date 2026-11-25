const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const GatePass = require('../models/GatePass');
const fetchuser = require('../middleware/fetchuser');

/**
 * GET /api/g/fetchlasttoken
 * Check if the student has an active (not yet completed) gate pass token for today
 * Protected: Student
 * 
 * Response:
 *   { status: true }                      — no active pass, can generate new one
 *   { status: false, last_data: {...}, ot: false } — has active pass today
 *   { status: false, ot: true }           — has a pass but it's already old (previous day)
 */
router.get('/fetchlasttoken', fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ response: false, message: 'User not found.' });
    }

    // Find the most recent gate pass for this student
    const lastPass = await GatePass.findOne({ user_id: req.user.id })
      .sort({ date: -1 });

    if (!lastPass) {
      // No passes ever generated
      return res.json({ status: true });
    }

    // Check if the last pass is from today and not yet completed (no in_time recorded)
    const today = new Date();
    const passDate = new Date(lastPass.date);
    const isSameDay = (
      passDate.getFullYear() === today.getFullYear() &&
      passDate.getMonth() === today.getMonth() &&
      passDate.getDate() === today.getDate()
    );

    if (isSameDay && !lastPass.in_time) {
      // Active pass today
      return res.json({
        status: false,
        ot: false,
        last_data: {
          name: lastPass.name,
          room_no: lastPass.room_no,
          token_no: lastPass.token_no,
          g1: lastPass.g1,
          g2: lastPass.g2,
          Subject: lastPass.Subject,
          out_time: lastPass.out_time,
          in_time: lastPass.in_time
        }
      });
    }

    // Pass is old or already completed
    return res.json({ status: true });

  } catch (err) {
    console.error('Error in fetchlasttoken:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/g/gatetoken
 * Generate a new gate pass token for the student
 * Protected: Student
 * 
 * Body: { Subject: string, It: string (expected return datetime) }
 */
router.post('/gatetoken', fetchuser, async (req, res) => {
  const { Subject, It } = req.body;

  if (!Subject || !Subject.trim()) {
    return res.status(400).json({
      response: false,
      message: 'Please provide a reason/purpose for the gate pass.'
    });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ response: false, message: 'User not found.' });
    }

    if (!user.room_no || user.room_no === 0) {
      return res.status(403).json({
        response: false,
        message: 'You must have a room allocated before requesting a gate pass.'
      });
    }

    // Check if student already has an active (not completed) pass today
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const existingPass = await GatePass.findOne({
      user_id: req.user.id,
      date: { $gte: todayStart, $lte: todayEnd },
      in_time: null  // Not yet returned
    });

    if (existingPass) {
      return res.status(400).json({
        response: false,
        message: 'You already have an active gate pass for today. Present the existing QR code to the security guard.'
      });
    }

    // Generate unique token number (UUID v4 for uniqueness + security)
    const token_no = uuidv4();

    const now = new Date();
    const g1 = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const g2 = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const gatePass = await GatePass.create({
      user_id: req.user.id,
      name: user.name,
      room_no: user.room_no,
      hostel: user.hostel || 'boys',
      Subject: Subject.trim(),
      It: It || '',
      token_no,
      g1,
      g2,
      date: now,
      pass_status: 'issued'
    });

    return res.json({
      response: true,
      message: 'Gate pass generated successfully. Present the QR code at the security gate.',
      token_no,
      pass_id: gatePass._id
    });

  } catch (err) {
    console.error('Error in gatetoken (POST):', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/g/gatetoken
 * Fetch the student's complete gate pass history
 * Protected: Student
 */
router.get('/gatetoken', fetchuser, async (req, res) => {
  try {
    const history = await GatePass.find({ user_id: req.user.id })
      .sort({ date: -1 })
      .limit(50);

    return res.json({
      response: true,
      history
    });

  } catch (err) {
    console.error('Error in gatetoken (GET):', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

module.exports = router;
