const mongoose = require('mongoose');
const { Schema } = mongoose;

const GatePassSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  room_no: {
    type: Number,
    required: true
  },
  Subject: {
    type: String,
    required: true,
    trim: true
  },
  It: {
    type: String,  // Expected return time (datetime string)
    default: ''
  },
  token_no: {
    type: String,
    required: true,
    unique: true
  },
  g1: {   // Issue date string
    type: String,
    default: ''
  },
  g2: {   // Issue time string
    type: String,
    default: ''
  },
  out_time: {
    type: Date,
    default: null
  },
  in_time: {
    type: Date,
    default: null
  },
  date: {
    type: Date,
    default: Date.now
  },
  // Status: 'issued' -> 'out' -> 'returned'
  pass_status: {
    type: String,
    enum: ['issued', 'out', 'returned'],
    default: 'issued'
  }
});

const GatePass = mongoose.model('gatepass', GatePassSchema);
module.exports = GatePass;
