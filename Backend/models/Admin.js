const mongoose = require('mongoose');
const { Schema } = mongoose;

const AdminSchema = new Schema({
  name: {
    type: String,
    required: true,
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
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin', 'warden', 'gate_security', 'mess_manager'],
    default: 'admin'
  },
  assignedHostel: {
    type: String,
    enum: ['all', 'boys', 'girls'],
    default: 'all'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Admin = mongoose.model('admin', AdminSchema);
module.exports = Admin;
