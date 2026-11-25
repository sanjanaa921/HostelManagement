const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Complain = require('../models/Complain');
const fetchuser = require('../middleware/fetchuser');

/**
 * GET /api/c/newcomplain
 * Fetch all complaints submitted by the authenticated student
 * Protected: Student (Strictly scoped to own records)
 */
router.get('/newcomplain', fetchuser, async (req, res) => {
  try {
    const complaints = await Complain.find({ user_id: req.user.id })
      .sort({ date: -1 });

    return res.json({
      response: true,
      allcomps: complaints
    });

  } catch (err) {
    console.error('Error in newcomplain (GET):', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/c/newcomplain
 * Submit a new grievance ticket
 * Protected: Student
 * 
 * Body: { title: string (optional), catagory: string, description: string }
 */
router.post(
  '/newcomplain',
  fetchuser,
  [
    body('catagory', 'Please select a valid complaint category').notEmpty(),
    body('description', 'Description must be at least 5 characters').isLength({ min: 5 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ response: false, message: errors.array()[0].msg });
    }

    const { title, catagory, description } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ response: false, message: 'Student account not found.' });
      }

      if (!user.room_no || user.room_no === 0) {
        return res.status(403).json({
          response: false,
          message: 'You must have a room allocated in your hostel before submitting complaints.'
        });
      }

      const complainTitle = title && title.trim() ? title.trim() : `${catagory} Maintenance - Room ${user.room_no}`;

      const complain = await Complain.create({
        user_id: req.user.id,
        name: user.name,
        studentId: user.studentId || '',
        room_no: user.room_no,
        hostel: user.hostel || 'boys',
        title: complainTitle,
        catagory,
        description: description.trim(),
        status: 'Pending',
        date: new Date()
      });

      return res.status(201).json({
        response: true,
        message: 'Grievance ticket registered successfully. Maintenance desk has been notified.',
        complain_id: complain._id,
        complain
      });

    } catch (err) {
      console.error('Error in newcomplain (POST):', err.message);
      return res.status(500).json({ response: false, message: 'Internal server error: ' + err.message });
    }
  }
);

/**
 * PATCH /api/c/newcomplain
 * Student marks their own complaint as Solved (self-service close)
 * Protected: Student
 */
router.patch('/newcomplain', fetchuser, async (req, res) => {
  const id = req.body.id || req.query.id;

  if (!id) {
    return res.status(400).json({ response: false, message: 'Complaint ID is required.' });
  }

  try {
    const complain = await Complain.findOne({ _id: id, user_id: req.user.id });

    if (!complain) {
      return res.status(404).json({
        response: false,
        message: 'Complaint not found or you do not have permission to modify it.'
      });
    }

    complain.status = 'Solved';
    complain.resolved_at = new Date();
    await complain.save();

    return res.json({
      response: true,
      message: 'Complaint marked as solved.',
      complain
    });

  } catch (err) {
    console.error('Error in newcomplain (PATCH):', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * DELETE /api/c/newcomplain
 * Student deletes their own complaint
 * Protected: Student
 */
router.delete('/newcomplain', fetchuser, async (req, res) => {
  const id = req.body.id || req.query.id;

  if (!id) {
    return res.status(400).json({ response: false, message: 'Complaint ID is required.' });
  }

  try {
    const complain = await Complain.findOne({ _id: id, user_id: req.user.id });

    if (!complain) {
      return res.status(404).json({
        response: false,
        message: 'Complaint not found or you do not have permission to delete it.'
      });
    }

    await Complain.findByIdAndDelete(id);

    return res.json({
      response: true,
      message: 'Complaint ticket deleted successfully.'
    });

  } catch (err) {
    console.error('Error in newcomplain (DELETE):', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

module.exports = router;
