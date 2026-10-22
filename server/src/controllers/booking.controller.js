const bookingModel = require('../models/booking.model');
const otpModel = require('../models/otp.model');
const eventModel = require('../models/event.model');
const { sendOtpEmail, sendBookingEmail } = require('../services/email.service');


/**
 * Send OTP to user's email for booking verification
 */
const sendBookingOtp = async (req, res) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
    await otpModel.findOneAndDelete({ email: req.user.email, action: 'event_booking' }); // Delete any existing OTP for the user
    await otpModel.create({ email: req.user.email, otp, action: 'event_booking' }); // Store the new OTP with a 5-minute expiration
    await sendOtpEmail(req.user.email, otp); // Send the OTP to the user's email 
    res.json.status(200).json({ message: 'OTP sent to your email. Please verify to complete the booking.' });

  }
  catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again later.' });
  }
}

