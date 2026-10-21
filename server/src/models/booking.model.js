const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  eventId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'], 
    default: 'unpaid',
  },
  amount: { 
    type: Number,
    required: true,
  }
}, { timestamps: true });


module.exports = mongoose.model('Booking',bookingSchema);