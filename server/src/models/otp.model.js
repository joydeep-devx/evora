const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,   
    required: true,
  },
  otp: {
    type: String, 
    required: true,
  },
  createdAt: {
    type: Date, 
    default: Date.now,
    expires: 300, // OTP expires after 5 minutes
  },
  action:{
    type: String,
    enum: ['account_verification', 'event_booking'],
  },
  attempts: {
    type: Number,
    default: 0, // Tries so far; see otp.service.js
  }
});

module.exports = mongoose.model('OTP', otpSchema);