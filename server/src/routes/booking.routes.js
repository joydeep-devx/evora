const express = require('express');
const { protect, admin } = require('../middlewares/auth.middleware');
const { getBookings, sendBookingOtp, bookEvent, confirmBooking, cancelBooking } = require('../controllers/booking.controller');
const router = express.Router();


// Show all bookings - api/bookings
router.get('/my', protect, getBookings);

// Book an event - api/bookings
router.post('/send-otp', protect, sendBookingOtp);

// Book an event after verifying the OTP - api/bookings
router.post('/', protect, bookEvent);

// Admin route to update booking status - api/bookings/:bookingId
router.put('/:bookingId', protect, admin, confirmBooking);

// Cancel a booking - api/bookings/:bookingId/cancel
router.delete('/:bookingId', protect, cancelBooking);


module.exports = router;