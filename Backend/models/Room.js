const mongoose = require('mongoose');
const { Schema } = mongoose;

const RoomSchema = new Schema({
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

// Compound unique index: room_no must be unique within its respective hostel
RoomSchema.index({ room_no: 1, hostel: 1 }, { unique: true });

const Room = mongoose.model('room', RoomSchema);
module.exports = Room;
