const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const fetchuser = require('../middleware/fetchuser');

/**
 * POST /api/f/feedback
 * Submit hostel/mess feedback
 * Protected: Student
 * 
 * Body: { title: string, message: string }
 */
router.post(
  '/feedback',
  fetchuser,
  [
    body('title', 'Please provide a topic/subject for your feedback').isLength({ min: 3 }).trim(),
    body('message', 'Feedback message must be at least 10 characters').isLength({ min: 10 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ response: false, message: errors.array()[0].msg });
    }

    const { title, message } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ response: false, message: 'User not found.' });
      }

      const feedback = await Feedback.create({
        user_id: req.user.id,
        name: user.name,
        studentId: user.studentId || '',
        hostel: user.hostel || (user.gender === 'Female' ? 'girls' : 'boys'),
        room_no: user.room_no || 0,
        title: title.trim(),
        message,
        date: new Date()
      });

      return res.status(201).json({
        response: true,
        message: 'Thank you! Your feedback has been shared with the hostel warden and mess management.',
        feedback
      });

    } catch (err) {
      console.error('Error in feedback (POST):', err.message);
      return res.status(500).json({ response: false, message: 'Internal server error.' });
    }
  }
);

/**
 * GET /api/f/feedback
 * Get the authenticated student's feedback submissions
 * Protected: Student
 */
router.get('/feedback', fetchuser, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user_id: req.user.id }).sort({ date: -1 });
    return res.json({ response: true, feedbacks });
  } catch (err) {
    console.error('Error in feedback (GET):', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

module.exports = router;
