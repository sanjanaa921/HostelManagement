const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessBillSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  room_no: {
    type: Number,
    required: true
  },
  month: {
    type: String,
    required: true,
    default: () => new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 6500
  },
  usedAmount: {
    type: Number,
    required: true,
    default: 4200
  },
  balance: {
    type: Number,
    required: true,
    default: 2300
  },
  status: {
    type: String,
    enum: ['Paid', 'Pending', 'Overdue'],
    default: 'Paid'
  },
  dueDate: {
    type: Date,
    default: () => {
      const d = new Date();
      d.setDate(d.getDate() + 15);
      return d;
    }
  },
  paymentHistory: [
    {
      amount: Number,
      date: { type: Date, default: Date.now },
      receiptNo: String,
      method: { type: String, default: 'Cash / Bank Transfer' }
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }
});

const MessBill = mongoose.model('messbill', MessBillSchema);
module.exports = MessBill;
