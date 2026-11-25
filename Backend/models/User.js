const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 5
  },
  mobile: {
    type: String,
    default: ''
  },
  studentId: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: true
  },
  hostel: {
    type: String,
    enum: ['boys', 'girls'],
    required: true,
    default: 'boys'
  },
  course: {
    type: String,
    default: 'MCA'
  },
  department: {
    type: String,
    default: 'Computer Applications'
  },
  academicYear: {
    type: String,
    default: '2nd Year'
  },
  guardianName: {
    type: String,
    default: ''
  },
  guardianPhone: {
    type: String,
    default: ''
  },
  relationship: {
    type: String,
    default: 'Parent'
  },
  room_no: {
    type: Number,
    default: 0
  },
  photo_url: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'   // Auto-approved for MCA demo; configurable
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('user', UserSchema);
module.exports = User;
