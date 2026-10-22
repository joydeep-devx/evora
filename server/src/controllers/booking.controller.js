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

/**
 * Book an event after verifying the OTP
 */
const bookEvent = async (req, res) => {
  try {
    const { eventId, otp } = req.body;

    // Verify OTP explicitly before proceeding
    const validOtp = await otpModel.findOne({ email: req.user.email, otp, action: 'event_booking' });
    if (!validOtp) {
      return res.status(400).json({ message: 'Invalid or Expired OTP for booking' });
    }

    const event = await eventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.availableSeats <= 0) {
      return res.status(400).json({ message: 'No available seats for this event' });
    }

    const existingBooking = await bookingModel.findOne({ user: req.user._id, event: eventId });
    if (existingBooking && existingBooking.status !== 'cancelled') {
      return res.status(400).json({ message: 'Already Booked or Pending' });
    }

    const booking = await bookingModel.create({
      userId: req.user._id,
      eventId: event._id,
      status: 'pending',
      paymentStatus: 'unpaid',
      amount: event.price
    });

    await otpModel.deleteOne({ _id: validOtp._id }); // Delete the OTP after successful booking

    res.status(201).json({ message: 'Booking request submitted', booking });
  }
  catch (error) {
    console.error('Error booking event:', error);
    res.status(500).json({ message: 'Failed to book event. Please try again later.' });
  }
}

const confirmBooking = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const booking = await Booking.findById(req.params.bookingId).populate('userId').populate('eventId');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'confirmed') {
      return res.status(400).json({ message: 'Booking is already confirmed' });
    }

    // Validate payment status if provided
    if (paymentStatus && !['paid', 'not_paid'].includes(paymentStatus)) {
      return res.status(400).json({
        message: 'Invalid payment status'
      });
    }

    const event = await eventModel.findById(booking.eventId._id);
    if (!event) {
      return res.status(404).json({
        message: 'Event not found'
      });
    }

    if (event.availableSeats <= 0) {
      return res.status(400).json({ message: 'No available seats for this event' });
    }

    booking.status = 'confirmed';

    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
    }
    await booking.save();

    event.availableSeats -= 1;
    await event.save();

    // Send confirmation email
    try {
      await sendBookingEmail(booking.userId.email, booking.userId.name, booking.eventId.title);
    } catch (emailError) {
      console.error('Failed to send booking email:', emailError);
    }

    res.status(200).json({ message: 'Booking confirmed successfully', booking });
  }
  catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({ message: 'Failed to confirm booking. Please try again later.' });
  }
}

module.exports = {
  sendBookingOtp,
  bookEvent,
  confirmBooking
}