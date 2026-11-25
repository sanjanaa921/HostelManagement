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
    enum: ['superadmin', 'warden', 'gate_security', 'mess_manager'],
    default: 'warden'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Admin = mongoose.model('admin', AdminSchema);
module.exports = Admin;
