const express = require('express');
const router = express.Router();
const GatePass = require('../models/GatePass');
const Complain = require('../models/Complain');
const fetchadmin = require('../middleware/fetchadmin');

/**
 * POST /api/ud/updateouttime
 * Gate security records student's EXIT (out) time
 * Protected: Admin (Gate Security role)
 * 
 * Body: { t_id: string (gate pass _id or token_no), out_time: ISO string }
 */
router.post('/updateouttime', fetchadmin, async (req, res) => {
  const { t_id, out_time } = req.body;

  if (!t_id) {
    return res.status(400).json({ response: false, message: 'Token ID is required.' });
  }

  try {
    // Try to find pass by _id first, then by token_no
    let pass = null;

    // Try as MongoDB _id
    if (t_id.length === 24) {
      try {
        pass = await GatePass.findById(t_id);
      } catch (e) { /* not a valid ObjectId */ }
    }

    // If not found by _id, try by token_no (UUID)
    if (!pass) {
      pass = await GatePass.findOne({ token_no: t_id });
    }

    if (!pass) {
      return res.status(404).json({
        response: false,
        message: 'Gate pass token not found. Please verify the token ID and try again.'
      });
    }

    // Cannot record exit if already returned
    if (pass.in_time) {
      return res.status(400).json({
        response: false,
        message: 'This pass has already been completed (student already returned). Cannot re-record exit.'
      });
    }

    // Cannot record exit again if already stamped
    if (pass.out_time) {
      return res.status(400).json({
        response: false,
        message: `Exit already recorded at ${new Date(pass.out_time).toLocaleString('en-IN')}. Student is currently outside.`
      });
    }

    const exitTime = out_time ? new Date(out_time) : new Date();

    await GatePass.findByIdAndUpdate(pass._id, {
      out_time: exitTime,
      pass_status: 'out'
    });

    return res.json({
      response: true,
      message: `Exit recorded for ${pass.name} (Room ${pass.room_no}) at ${exitTime.toLocaleTimeString('en-IN')}.`
    });

  } catch (err) {
    console.error('Error in updateouttime:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/ud/updateintime
 * Gate security records student's RETURN (in) time
 * Protected: Admin (Gate Security role)
 * 
 * Body: { t_id: string (gate pass _id or token_no), in_time: ISO string }
 */
router.post('/updateintime', fetchadmin, async (req, res) => {
  const { t_id, in_time } = req.body;

  if (!t_id) {
    return res.status(400).json({ response: false, message: 'Token ID is required.' });
  }

  try {
    // Try to find pass by _id first, then by token_no
    let pass = null;

    if (t_id.length === 24) {
      try {
        pass = await GatePass.findById(t_id);
      } catch (e) { /* not a valid ObjectId */ }
    }

    if (!pass) {
      pass = await GatePass.findOne({ token_no: t_id });
    }

    if (!pass) {
      return res.status(404).json({
        response: false,
        message: 'Gate pass token not found. Please verify the token ID and try again.'
      });
    }

    // Cannot record return if student hasn't been marked as exited
    if (!pass.out_time) {
      return res.status(400).json({
        response: false,
        message: 'No exit has been recorded for this pass. Please record exit (OUT) before recording return (IN).'
      });
    }

    // Already returned
    if (pass.in_time) {
      return res.status(400).json({
        response: false,
        message: `Return already recorded at ${new Date(pass.in_time).toLocaleString('en-IN')}.`
      });
    }

    const returnTime = in_time ? new Date(in_time) : new Date();

    await GatePass.findByIdAndUpdate(pass._id, {
      in_time: returnTime,
      pass_status: 'returned'
    });

    return res.json({
      response: true,
      message: `Return recorded for ${pass.name} (Room ${pass.room_no}) at ${returnTime.toLocaleTimeString('en-IN')}.`
    });

  } catch (err) {
    console.error('Error in updateintime:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * PATCH /api/ud/resolvecomplain
 * Admin marks a complaint as resolved
 * Protected: Admin
 * 
 * Body: { id: string (complaint _id), status: string, admin_remarks: string (optional) }
 */
router.patch('/resolvecomplain', fetchadmin, async (req, res) => {
  const { id, status, admin_remarks } = req.body;

  if (!id) {
    return res.status(400).json({ response: false, message: 'Complaint ID is required.' });
  }

  const allowedStatuses = ['Pending', 'In Progress', 'Solved', 'Rejected'];
  const finalStatus = allowedStatuses.includes(status) ? status : 'Solved';

  try {
    const updateData = {
      status: finalStatus,
      resolved_at: finalStatus === 'Solved' ? new Date() : null
    };

    if (admin_remarks) {
      updateData.admin_remarks = admin_remarks;
    }

    const complain = await Complain.findByIdAndUpdate(id, updateData, { new: true });

    if (!complain) {
      return res.status(404).json({ response: false, message: 'Complaint not found.' });
    }

    return res.json({
      response: true,
      message: `Complaint status updated to "${finalStatus}" successfully.`,
      complain
    });

  } catch (err) {
    console.error('Error in resolvecomplain:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

module.exports = router;
