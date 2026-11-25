const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Complain = require('../models/Complain');
const fetchuser = require('../middleware/fetchuser');

/**
 * GET /api/c/newcomplain
 * Fetch all complaints submitted by the authenticated student
 * Protected: Student
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
 * Submit a new complaint
 * Protected: Student
 * 
 * Body: { catagory: string, description: string }
 */
router.post(
  '/newcomplain',
  fetchuser,
  [
    body('catagory', 'Please select a valid complaint category').notEmpty(),
    body('description', 'Description must be at least 10 characters').isLength({ min: 10 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ response: false, message: errors.array()[0].msg });
    }

    const { catagory, description } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ response: false, message: 'User not found.' });
      }

      if (!user.room_no || user.room_no === 0) {
        return res.status(403).json({
          response: false,
          message: 'You must have a room allocated before submitting complaints.'
        });
      }

      const complain = await Complain.create({
        user_id: req.user.id,
        name: user.name,
        room_no: user.room_no,
        catagory,
        description,
        status: 'Pending',
        date: new Date()
      });

      return res.status(201).json({
        response: true,
        message: 'Complaint registered successfully. The warden desk has been notified.',
        complain_id: complain._id
      });

    } catch (err) {
      console.error('Error in newcomplain (POST):', err.message);
      return res.status(500).json({ response: false, message: 'Internal server error.' });
    }
  }
);

/**
 * PATCH /api/c/newcomplain
 * Student marks their own complaint as Solved (self-service close)
 * Protected: Student (can only close their own complaints)
 * 
 * Body: { id: string (complaint _id) }
 */
router.patch('/newcomplain', fetchuser, async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ response: false, message: 'Complaint ID is required.' });
  }

  try {
    // Ensure the complaint belongs to this student
    const complain = await Complain.findOne({ _id: id, user_id: req.user.id });

    if (!complain) {
      return res.status(404).json({
        response: false,
        message: 'Complaint not found or you do not have permission to modify it.'
      });
    }

    await Complain.findByIdAndUpdate(id, {
      status: 'Solved',
      resolved_at: new Date()
    });

    return res.json({
      response: true,
      message: 'Complaint marked as solved.'
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
 * 
 * Body: { id: string (complaint _id) }
 */
router.delete('/newcomplain', fetchuser, async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ response: false, message: 'Complaint ID is required.' });
  }

  try {
    // Ensure the complaint belongs to this student
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
