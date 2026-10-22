const express = require('express');
const { protect, admin } = require('../middlewares/auth.middleware');
const { sendBookingOtp, bookEvent, confirmBooking } = require('../controllers/booking.controller');
const router = express.Router();

// Book an event - api/bookings
router.post('/send-otp', protect, sendBookingOtp);

// Book an event after verifying the OTP - api/bookings
router.post('/', protect, bookEvent);

// Admin route to update booking status - api/bookings/:bookingId
router.put('/:bookingId', protect , admin ,confirmBooking);


module.exports = router;