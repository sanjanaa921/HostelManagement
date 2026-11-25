const mongoose = require('mongoose');
const { Schema } = mongoose;

const FeedbackSchema = new Schema({
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
  hostel: {
    type: String,
    enum: ['boys', 'girls'],
    default: 'boys'
  },
  room_no: {
    type: Number,
    default: 0
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    minlength: 5
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Feedback = mongoose.model('feedback', FeedbackSchema);
module.exports = Feedback;
