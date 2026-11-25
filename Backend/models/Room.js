const mongoose = require('mongoose');
const { Schema } = mongoose;

const RoomSchema = new Schema({
  room_no: {
    type: Number,
    required: true,
    unique: true
  },
  floor: {
    type: String,
    enum: ['ground', 'first', 'second'],
    required: true
  },
  block: {
    type: String,
    default: 'Mega Boys Block A'
  },
  capacity: {
    type: Number,
    default: 1
  },
  occupiedBeds: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance'],
    default: 'available'
  },
  roomCharges: {
    type: Number,
    default: 4500 // per semester
  },
  amenities: [String]
});

const Room = mongoose.model('room', RoomSchema);
module.exports = Room;
