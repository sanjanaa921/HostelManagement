const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Room = require('../models/Room');
const Complain = require('../models/Complain');
const GatePass = require('../models/GatePass');
const Attendance = require('../models/Attendance');
const Feedback = require('../models/Feedback');
const fetchadmin = require('../middleware/fetchadmin');

/**
 * Helper function to resolve Admin Hostel filtering
 * 
 * Rules:
 * - Admin has complete oversight and management capabilities for BOTH Boys and Girls Hostels.
 * - Supports ?hostel=boys, ?hostel=girls, or ?hostel=all (default).
 */
function resolveHostelAccess(admin, requestedHostel) {
  const isGlobalAdmin = admin && (admin.role === 'superadmin' || admin.role === 'admin' || !admin.assignedHostel || admin.assignedHostel === 'all');

  if (!isGlobalAdmin) {
    if (requestedHostel && requestedHostel !== 'all' && requestedHostel !== admin.assignedHostel) {
      return {
        forbidden: true,
        error: `Access denied. You are only authorized to manage ${admin.assignedHostel === 'boys' ? 'Boys' : 'Girls'} Hostel records.`
      };
    }
    return { hostel: admin.assignedHostel };
  }

  if (requestedHostel === 'boys' || requestedHostel === 'girls') {
    return { hostel: requestedHostel };
  }
  return { hostel: null };
}

/**
 * GET /api/ad/getallusers
 * Get all students with allocated rooms (residents directory)
 * Protected: Admin
 * Supports query: ?hostel=boys|girls|all
 */
router.get('/getallusers', fetchadmin, async (req, res) => {
  try {
    const access = resolveHostelAccess(req.admin, req.query.hostel);
    if (access.forbidden) {
      return res.status(403).json({ response: false, message: access.error });
    }

    const query = { room_no: { $gt: 0 } };
    if (access.hostel) {
      query.hostel = access.hostel;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ hostel: 1, room_no: 1 });

    return res.json({
      response: true,
      activeHostelFilter: access.hostel || 'all',
      data: users
    });

  } catch (err) {
    console.error('Error in getallusers:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/ad/allcomplains
 * Get all complaints
 * Protected: Admin
 * Supports query: ?hostel=boys|girls|all
 */
router.get('/allcomplains', fetchadmin, async (req, res) => {
  try {
    const access = resolveHostelAccess(req.admin, req.query.hostel);
    if (access.forbidden) {
      return res.status(403).json({ response: false, message: access.error });
    }

    const query = {};
    if (access.hostel) {
      query.hostel = access.hostel;
    }

    const complains = await Complain.find(query)
      .sort({ date: -1 });

    return res.json({
      response: true,
      activeHostelFilter: access.hostel || 'all',
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
 * Get all gate passes
 * Protected: Admin
 * Supports query: ?hostel=boys|girls|all
 */
router.get('/getallpasses', fetchadmin, async (req, res) => {
  try {
    const access = resolveHostelAccess(req.admin, req.query.hostel);
    if (access.forbidden) {
      return res.status(403).json({ response: false, message: access.error });
    }

    const query = {};
    if (access.hostel) {
      query.hostel = access.hostel;
    }

    const passes = await GatePass.find(query)
      .sort({ date: -1 });

    return res.json({
      response: true,
      activeHostelFilter: access.hostel || 'all',
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
 * Supports query: ?hostel=boys|girls|all
 */
router.get('/allattendance', fetchadmin, async (req, res) => {
  try {
    const access = resolveHostelAccess(req.admin, req.query.hostel);
    if (access.forbidden) {
      return res.status(403).json({ response: false, message: access.error });
    }

    const query = {};
    if (access.hostel) {
      query.hostel = access.hostel;
    }

    const records = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(500);

    return res.json({
      response: true,
      activeHostelFilter: access.hostel || 'all',
      data: records
    });

  } catch (err) {
    console.error('Error in allattendance:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/ad/allfeedback
 * Get student feedback submissions
 * Protected: Admin
 */
router.get('/allfeedback', fetchadmin, async (req, res) => {
  try {
    const access = resolveHostelAccess(req.admin, req.query.hostel);
    if (access.forbidden) {
      return res.status(403).json({ response: false, message: access.error });
    }

    const query = {};
    if (access.hostel) {
      query.hostel = access.hostel;
    }

    const feedbacks = await Feedback.find(query).sort({ date: -1 });

    return res.json({
      response: true,
      activeHostelFilter: access.hostel || 'all',
      feedbacks,
      count: feedbacks.length
    });

  } catch (err) {
    console.error('Error in allfeedback:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/ad/rooms
 * Get complete room directory and bed allocations
 * Protected: Admin
 * Supports query: ?hostel=boys|girls|all
 */
router.get('/rooms', fetchadmin, async (req, res) => {
  try {
    const access = resolveHostelAccess(req.admin, req.query.hostel);
    if (access.forbidden) {
      return res.status(403).json({ response: false, message: access.error });
    }

    const query = {};
    if (access.hostel) {
      query.hostel = access.hostel;
    }

    const rooms = await Room.find(query).sort({ hostel: 1, room_no: 1 });

    return res.json({
      response: true,
      activeHostelFilter: access.hostel || 'all',
      rooms
    });

  } catch (err) {
    console.error('Error in rooms directory:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/ad/dashboardstats
 * Live statistics for the admin dashboard with hostel filtering and breakdown
 * Protected: Admin
 * Supports query: ?hostel=boys|girls|all
 */
router.get('/dashboardstats', fetchadmin, async (req, res) => {
  try {
    const access = resolveHostelAccess(req.admin, req.query.hostel);
    if (access.forbidden) {
      return res.status(403).json({ response: false, message: access.error });
    }

    const filterHostel = access.hostel;
    const userQuery = filterHostel ? { hostel: filterHostel } : {};
    const occupiedUserQuery = filterHostel ? { hostel: filterHostel, room_no: { $gt: 0 } } : { room_no: { $gt: 0 } };
    const complainQuery = filterHostel ? { hostel: filterHostel } : {};
    const passQuery = filterHostel ? { hostel: filterHostel } : {};
    const attendanceQuery = filterHostel ? { hostel: filterHostel } : {};

    const totalStudents = await User.countDocuments(userQuery);
    const occupiedRooms = await User.countDocuments(occupiedUserQuery);
    
    // Each hostel has 60 rooms (20 ground + 20 1st + 20 2nd)
    const totalCapacity = filterHostel ? 60 : 120;
    const availableRooms = Math.max(0, totalCapacity - occupiedRooms);

    const pendingComplaints = await Complain.countDocuments({ ...complainQuery, status: 'Pending' });
    const resolvedComplaints = await Complain.countDocuments({ ...complainQuery, status: 'Solved' });

    const studentsOutside = await GatePass.countDocuments({
      ...passQuery,
      out_time: { $ne: null },
      in_time: null
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayAttendance = await Attendance.countDocuments({
      ...attendanceQuery,
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['Present', 'ok'] }
    });

    // Per-hostel breakdown stats
    const boysOccupied = await User.countDocuments({ hostel: 'boys', room_no: { $gt: 0 } });
    const girlsOccupied = await User.countDocuments({ hostel: 'girls', room_no: { $gt: 0 } });

    return res.json({
      response: true,
      stats: {
        totalStudents,
        totalCapacity,
        occupiedRooms,
        availableRooms,
        pendingComplaints,
        resolvedComplaints,
        studentsOutside,
        todayAttendance,
        hostelFilter: filterHostel || 'all',
        breakdown: {
          boys: {
            capacity: 60,
            occupied: boysOccupied,
            available: Math.max(0, 60 - boysOccupied)
          },
          girls: {
            capacity: 60,
            occupied: girlsOccupied,
            available: Math.max(0, 60 - girlsOccupied)
          }
        }
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
 * Protected: Admin (strictly verified against warden hostel scope)
 */
router.delete('/deallocateroom/:userId', fetchadmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ response: false, message: 'Student record not found.' });
    }

    const previousRoom = user.room_no;
    const userHostel = user.hostel;

    user.room_no = 0;
    await user.save();

    // Update Room collection record to mark available
    if (previousRoom > 0) {
      await Room.findOneAndUpdate(
        { room_no: previousRoom, hostel: userHostel },
        { status: 'available', occupied_beds: 0, occupiedBeds: 0, available_beds: 1 }
      );
    }

    return res.json({
      response: true,
      message: `Room ${previousRoom} allocation removed for ${user.name} (${userHostel === 'boys' ? 'Boys' : 'Girls'} Hostel).`
    });

  } catch (err) {
    console.error('Error in deallocateroom:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * PATCH /api/ad/correctgender/:userId
 * Authorized administrator corrects student gender and migrates hostel assignment safely.
 * Protected: Admin (Superadmin or authorized Warden)
 * 
 * Body: { gender: 'Male' | 'Female' }
 */
router.patch('/correctgender/:userId', fetchadmin, async (req, res) => {
  const { gender } = req.body;

  if (!gender || !['Male', 'Female'].includes(gender)) {
    return res.status(400).json({
      response: false,
      message: 'Invalid gender. Allowed values: Male or Female.'
    });
  }

  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ response: false, message: 'Student record not found.' });
    }

    const newHostel = gender === 'Female' ? 'girls' : 'boys';
    const oldHostel = user.hostel;
    const oldRoom = user.room_no;

    user.gender = gender;
    user.hostel = newHostel;

    // If student changes hostel and already had a room in the old hostel, free the room
    if (oldHostel !== newHostel && oldRoom > 0) {
      user.room_no = 0;
      await Room.findOneAndUpdate(
        { room_no: oldRoom, hostel: oldHostel },
        { status: 'available', occupied_beds: 0, occupiedBeds: 0, available_beds: 1 }
      );
    }

    await user.save();

    return res.json({
      response: true,
      message: `Student gender corrected to ${gender}. Hostel updated to ${newHostel === 'boys' ? 'Boys' : 'Girls'} Hostel.${oldRoom > 0 ? ` Previous Room ${oldRoom} in ${oldHostel} hostel deallocated.` : ''}`,
      user: {
        id: user._id,
        name: user.name,
        gender: user.gender,
        hostel: user.hostel,
        room_no: user.room_no
      }
    });

  } catch (err) {
    console.error('Error in correctgender:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

module.exports = router;
