const express = require('express');
const router = express.Router();
const User = require('../models/User');
const fetchuser = require('../middleware/fetchuser');

/**
 * GET /api/b/roomnumbers
 * Returns all currently booked room numbers
 * Protected: Student
 */
router.get('/roomnumbers', fetchuser, async (req, res) => {
  try {
    // Find all users with a room allocated (room_no > 0)
    const bookedUsers = await User.find({ room_no: { $gt: 0 } }).select('room_no');
    const roomNumbers = bookedUsers.map(u => u.room_no);

    return res.json(roomNumbers);

  } catch (err) {
    console.error('Error in roomnumbers:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/b/bookroom
 * Book (allocate) a room for the authenticated student
 * Protected: Student
 * 
 * Body: { room: Number }
 * 
 * Rules:
 * 1. Student must not already have a room allocated.
 * 2. The requested room must not already be occupied by another student.
 * 3. Valid room numbers: 1-20 (ground), 101-120 (1st floor), 201-220 (2nd floor)
 */
router.post('/bookroom', fetchuser, async (req, res) => {
  const { room } = req.body;
  const roomNum = parseInt(room);

  // Validate room number is a valid room in the hostel
  const validRoom = (
    (roomNum >= 1 && roomNum <= 20) ||
    (roomNum >= 101 && roomNum <= 120) ||
    (roomNum >= 201 && roomNum <= 220)
  );

  if (!validRoom || isNaN(roomNum)) {
    return res.status(400).json({
      response: false,
      message: 'Invalid room number. Please select a valid room from the available list.'
    });
  }

  try {
    // Check if requesting student already has a room
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ response: false, message: 'User not found.' });
    }

    if (currentUser.room_no && currentUser.room_no > 0) {
      return res.status(400).json({
        response: false,
        message: `You already have Room ${currentUser.room_no} allocated. Please contact the warden for a room change.`
      });
    }

    // Check if the requested room is already occupied by another student
    const existingOccupant = await User.findOne({ room_no: roomNum });
    if (existingOccupant) {
      return res.status(409).json({
        response: false,
        message: `Room ${roomNum} is already occupied. Please select a different room.`
      });
    }

    // Allocate the room to this student
    await User.findByIdAndUpdate(req.user.id, { room_no: roomNum });

    return res.json({
      response: true,
      message: `Room ${roomNum} has been successfully allocated to your account.`,
      room_no: roomNum
    });

  } catch (err) {
    console.error('Error in bookroom:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

module.exports = router;
