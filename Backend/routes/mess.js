const express = require('express');
const router = express.Router();
const MessBill = require('../models/MessBill');
const User = require('../models/User');
const fetchuser = require('../middleware/fetchuser');
const fetchadmin = require('../middleware/fetchadmin');

/**
 * GET /api/m/bill
 * Get the current student's mess bill and balance
 * Protected: Student
 */
router.get('/bill', fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ response: false, message: 'User not found.' });
    }

    // Find the latest mess bill for this student
    let bill = await MessBill.findOne({ user_id: req.user.id }).sort({ date: -1 });

    // If no bill exists yet and student has a room, initialize a default bill
    if (!bill && user.room_no && user.room_no > 0) {
      bill = await MessBill.create({
        user_id: user._id,
        studentName: user.name,
        room_no: user.room_no,
        month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        totalAmount: 6500,
        usedAmount: 4200,
        balance: 2300,
        status: 'Paid',
        paymentHistory: [
          {
            amount: 6500,
            date: new Date(),
            receiptNo: `REC-${Date.now().toString().slice(-6)}`,
            method: 'Semester Fee Advance'
          }
        ]
      });
    }

    if (!bill) {
      return res.json({
        response: true,
        bill: {
          total: "0",
          used: "0",
          balance: "0",
          status: "No active room allotment"
        }
      });
    }

    return res.json({
      response: true,
      bill: {
        total: String(bill.totalAmount),
        used: String(bill.usedAmount),
        balance: String(bill.balance),
        status: bill.status,
        month: bill.month,
        dueDate: bill.dueDate,
        paymentHistory: bill.paymentHistory
      }
    });

  } catch (err) {
    console.error('Error in /api/m/bill:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/m/bills
 * Get all student mess bills
 * Protected: Admin (Mess Manager / Warden)
 */
router.get('/bills', fetchadmin, async (req, res) => {
  try {
    const bills = await MessBill.find().sort({ date: -1 });
    return res.json({
      response: true,
      bills
    });
  } catch (err) {
    console.error('Error in /api/m/bills:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/m/generate
 * Generate or update a student's monthly mess bill
 * Protected: Admin
 * 
 * Body: { userId, month, totalAmount, usedAmount }
 */
router.post('/generate', fetchadmin, async (req, res) => {
  const { userId, month, totalAmount, usedAmount } = req.body;

  if (!userId) {
    return res.status(400).json({ response: false, message: 'User ID is required.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ response: false, message: 'Student not found.' });
    }

    const total = Number(totalAmount) || 6500;
    const used = Number(usedAmount) || 0;
    const balance = Math.max(0, total - used);

    const bill = await MessBill.create({
      user_id: user._id,
      studentName: user.name,
      room_no: user.room_no || 0,
      month: month || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      totalAmount: total,
      usedAmount: used,
      balance: balance,
      status: balance > 0 ? 'Paid' : 'Pending'
    });

    return res.status(201).json({
      response: true,
      message: `Mess bill generated for ${user.name} (${bill.month}).`,
      bill
    });

  } catch (err) {
    console.error('Error in /api/m/generate:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/m/payment
 * Record a mess bill payment
 * Protected: Admin
 * 
 * Body: { billId, amount, method }
 */
router.post('/payment', fetchadmin, async (req, res) => {
  const { billId, amount, method } = req.body;

  if (!billId || !amount) {
    return res.status(400).json({ response: false, message: 'Bill ID and amount are required.' });
  }

  try {
    const bill = await MessBill.findById(billId);
    if (!bill) {
      return res.status(404).json({ response: false, message: 'Mess bill not found.' });
    }

    const receiptNo = `REC-${Date.now().toString().slice(-6)}`;
    const payment = {
      amount: Number(amount),
      date: new Date(),
      receiptNo,
      method: method || 'Online / UPI'
    };

    bill.paymentHistory.push(payment);
    bill.balance = Math.max(0, bill.balance - Number(amount));
    if (bill.balance === 0) bill.status = 'Paid';

    await bill.save();

    return res.json({
      response: true,
      message: `Payment of ₹${amount} recorded successfully. Receipt No: ${receiptNo}`,
      receiptNo,
      bill
    });

  } catch (err) {
    console.error('Error in /api/m/payment:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

module.exports = router;
