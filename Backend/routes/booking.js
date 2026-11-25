const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Room = require('../models/Room');
const fetchuser = require('../middleware/fetchuser');

/**
 * GET /api/b/roomnumbers
 * Returns booked room numbers for the authenticated student's assigned hostel ONLY.
 * Protected: Student
 */
router.get('/roomnumbers', fetchuser, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ response: false, message: 'User not found.' });
    }

    const hostel = currentUser.hostel || (req.user.gender === 'Female' ? 'girls' : 'boys');

    // Query booked rooms strictly belonging to this student's hostel
    const bookedUsers = await User.find({ hostel, room_no: { $gt: 0 } }).select('room_no');
    const roomNumbers = bookedUsers.map(u => u.room_no);

    return res.json(roomNumbers);

  } catch (err) {
    console.error('Error in roomnumbers:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/b/hostelrooms
 * Returns all room metadata for the student's assigned hostel.
 * Protected: Student
 */
router.get('/hostelrooms', fetchuser, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ response: false, message: 'User not found.' });
    }

    const hostel = currentUser.hostel || 'boys';
    const rooms = await Room.find({ hostel }).sort({ room_no: 1 });

    return res.json({
      response: true,
      hostel,
      block_name: hostel === 'boys' ? 'Mega Boys Block A' : 'Kaveri Girls Block A',
      rooms
    });

  } catch (err) {
    console.error('Error in hostelrooms:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/b/bookroom
 * Book (allocate) a room for the authenticated student.
 * 
 * Strict Gender & Hostel Enforcement:
 * 1. Identify the authenticated student and their assigned hostel (boys / girls).
 * 2. Validate room number: valid range 1-20, 101-120, 201-220.
 * 3. Verify requested room belongs to the student's assigned hostel.
 * 4. Reject cross-hostel attempts (e.g. boy attempting to book girls' room, or vice versa).
 * 5. Reject if student already has a room allocated.
 * 6. Reject if room is already occupied in that hostel.
 * 7. Atomically allocate room and update Room collection availability.
 */
router.post('/bookroom', fetchuser, async (req, res) => {
  const { room, hostel: requestedHostel } = req.body;
  const roomNum = parseInt(room);

  // Validate room number range
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
    // 1. Identify authenticated student
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ response: false, message: 'Student account not found.' });
    }

    // 2. Determine student's assigned hostel
    const studentHostel = currentUser.hostel || (currentUser.gender === 'Female' ? 'girls' : 'boys');

    // 3. Security check: Reject cross-hostel tampering if client explicitly sent conflicting hostel
    if (requestedHostel && requestedHostel.toLowerCase() !== studentHostel) {
      return res.status(403).json({
        response: false,
        message: `Security violation: Cross-hostel booking rejected. You are assigned to the ${studentHostel === 'boys' ? 'Boys' : 'Girls'} Hostel and cannot book rooms in the ${requestedHostel === 'boys' ? 'Boys' : 'Girls'} Hostel.`
      });
    }

    // 4. Check if student already has a room allocated
    if (currentUser.room_no && currentUser.room_no > 0) {
      return res.status(400).json({
        response: false,
        message: `You already have Room ${currentUser.room_no} allocated in ${studentHostel === 'boys' ? 'Boys' : 'Girls'} Hostel. Please contact the administrator for a room reassignment.`
      });
    }

    // 5. Atomic conditional reservation of the room in Room collection
    // Guarantees that two concurrent students cannot book the same room/bed simultaneously.
    let updatedRoom = await Room.findOneAndUpdate(
      {
        room_no: roomNum,
        hostel: studentHostel,
        status: { $ne: 'occupied' }
      },
      {
        $set: {
          status: 'occupied',
          occupied_beds: 1,
          occupiedBeds: 1,
          available_beds: 0
        }
      },
      { new: true }
    );

    // If room record didn't exist yet, attempt atomic upsert only if not occupied
    if (!updatedRoom) {
      const existingRoom = await Room.findOne({ room_no: roomNum, hostel: studentHostel });
      if (existingRoom && existingRoom.status === 'occupied') {
        return res.status(409).json({
          response: false,
          message: `Room ${roomNum} is already occupied in the ${studentHostel === 'boys' ? 'Boys' : 'Girls'} Hostel. Please select an available room.`
        });
      }
      // If it genuinely did not exist in Room collection, create it as occupied
      if (!existingRoom) {
        updatedRoom = await Room.create({
          room_no: roomNum,
          hostel: studentHostel,
          floor: roomNum >= 200 ? 'second' : (roomNum >= 100 ? 'first' : 'ground'),
          capacity: 1,
          occupied_beds: 1,
          occupiedBeds: 1,
          available_beds: 0,
          status: 'occupied',
          block: studentHostel === 'boys' ? 'Mega Boys Block A' : 'Kaveri Girls Block A'
        });
      }
    }

    // 6. Assign room to student atomically
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: req.user.id,
        $or: [{ room_no: 0 }, { room_no: null }, { room_no: { $exists: false } }]
      },
      { $set: { room_no: roomNum } },
      { new: true }
    );

    if (!updatedUser) {
      // Revert room reservation if user already had a room allocated
      await Room.findOneAndUpdate(
        { room_no: roomNum, hostel: studentHostel },
        { $set: { status: 'available', occupied_beds: 0, occupiedBeds: 0, available_beds: 1 } }
      );
      return res.status(400).json({
        response: false,
        message: 'You already have a room allocated. Please contact the administrator.'
      });
    }

    return res.json({
      response: true,
      message: `Room ${roomNum} in ${studentHostel === 'boys' ? 'Boys' : 'Girls'} Hostel has been successfully allocated to your account.`,
      room_no: roomNum,
      hostel: studentHostel
    });

  } catch (err) {
    console.error('Error in bookroom:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

module.exports = router;
