const mongoose = require('mongoose');
const { Schema } = mongoose;

const AttendanceSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  studentId: {
    type: String,
    default: ''
  },
  room_no: {
    type: Number,
    required: true
  },
  hostel: {
    type: String,
    enum: ['boys', 'girls'],
    required: true,
    default: 'boys'
  },
  date: {
    type: Date,
    default: Date.now
  },
  latitude: {
    type: Number,
    default: 0
  },
  longitude: {
    type: Number,
    default: 0
  },
  location_verified: {
    type: Boolean,
    default: false
  },
  face_verified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'ok'],
    default: 'Present'
  }
});

const Attendance = mongoose.model('attendance', AttendanceSchema);
module.exports = Attendance;
