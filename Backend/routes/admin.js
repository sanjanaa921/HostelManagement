const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Complain = require('../models/Complain');
const GatePass = require('../models/GatePass');
const Attendance = require('../models/Attendance');
const Feedback = require('../models/Feedback');
const fetchadmin = require('../middleware/fetchadmin');

/**
 * GET /api/ad/getallusers
 * Get all students with allocated rooms (residents directory)
 * Protected: Admin
 */
router.get('/getallusers', fetchadmin, async (req, res) => {
  try {
    const users = await User.find({ room_no: { $gt: 0 } })
      .select('-password')
      .sort({ room_no: 1 });

    return res.json({
      response: true,
      data: users
    });

  } catch (err) {
    console.error('Error in getallusers:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/ad/allcomplains
 * Get all complaints (for admin dashboard and complaints management page)
 * Protected: Admin
 */
router.get('/allcomplains', fetchadmin, async (req, res) => {
  try {
    const complains = await Complain.find()
      .sort({ date: -1 });

    return res.json({
      response: true,
      allcomps: complains,
      complains_length: complains.length
    });

  } catch (err) {
    console.error('Error in allcomplains:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/ad/getallpasses
 * Get all gate passes (for admin dashboard and gate security page)
 * Protected: Admin
 */
router.get('/getallpasses', fetchadmin, async (req, res) => {
  try {
    const passes = await GatePass.find()
      .sort({ date: -1 });

    return res.json({
      response: true,
      allpasses: passes,
      allpasses_length: passes.length
    });

  } catch (err) {
    console.error('Error in getallpasses:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/ad/allattendance
 * Get all attendance records
 * Protected: Admin
 */
router.get('/allattendance', fetchadmin, async (req, res) => {
  try {
    const records = await Attendance.find()
      .sort({ date: -1 })
      .limit(500);

    return res.json({
      response: true,
      data: records
    });

  } catch (err) {
    console.error('Error in allattendance:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/ad/allfeedback
 * Get all student feedback submissions
 * Protected: Admin
 */
router.get('/allfeedback', fetchadmin, async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ date: -1 });

    return res.json({
      response: true,
      feedbacks,
      count: feedbacks.length
    });

  } catch (err) {
    console.error('Error in allfeedback:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/ad/dashboardstats
 * Get live statistics for the admin dashboard
 * Protected: Admin
 */
router.get('/dashboardstats', fetchadmin, async (req, res) => {
  try {
    const totalStudents = await User.countDocuments();
    const occupiedRooms = await User.countDocuments({ room_no: { $gt: 0 } });
    const pendingComplaints = await Complain.countDocuments({ status: 'Pending' });
    const resolvedComplaints = await Complain.countDocuments({ status: 'Solved' });

    // Students currently outside (gate pass issued and out but not yet returned)
    const studentsOutside = await GatePass.countDocuments({
      out_time: { $ne: null },
      in_time: null
    });

    // Today's attendance
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['Present', 'ok'] }
    });

    return res.json({
      response: true,
      stats: {
        totalStudents,
        occupiedRooms,
        availableRooms: Math.max(0, 60 - occupiedRooms), // Assuming 60 capacity
        pendingComplaints,
        resolvedComplaints,
        studentsOutside,
        todayAttendance
      }
    });

  } catch (err) {
    console.error('Error in dashboardstats:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * DELETE /api/ad/deallocateroom/:userId
 * Admin removes a student's room allocation
 * Protected: Admin
 */
router.delete('/deallocateroom/:userId', fetchadmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { room_no: 0 },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ response: false, message: 'Student not found.' });
    }

    return res.json({
      response: true,
      message: `Room allocation removed for ${user.name}.`
    });

  } catch (err) {
    console.error('Error in deallocateroom:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

module.exports = router;
