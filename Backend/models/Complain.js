const mongoose = require('mongoose');
const { Schema } = mongoose;

const ComplainSchema = new Schema({
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
  catagory: {   // Note: keeping original typo from frontend ("catagory" not "category")
    type: String,
    required: true,
    enum: ['Electricity', 'Plumbing', 'Wifi', 'Food', 'Room', 'Cleaning', 'Others']
  },
  description: {
    type: String,
    required: true,
    minlength: 5
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Solved', 'Rejected'],
    default: 'Pending'
  },
  admin_remarks: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  },
  resolved_at: {
    type: Date,
    default: null
  }
});

const Complain = mongoose.model('complain', ComplainSchema);
module.exports = Complain;
