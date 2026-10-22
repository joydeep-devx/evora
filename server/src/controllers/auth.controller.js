const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const otpModel = require('../models/otp.model');
const { sendOtpEmail } = require('../services/email.service');

/**
 * Register User
 */
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userAlreadyExists = await userModel.findOne({ email });
    if (userAlreadyExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
      role: 'user',
      isVerified: false
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await otpModel.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
    });
    await sendOtpEmail(email, otp, 'account_verification');

    res.status(201).json({
      message: 'User registered successfully. Please check your email for the OTP to verify your account.',
      email: user.email
    });
  }
  catch (error) {
    console.error('Error in registerUser:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

/**
 * Login User
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials Please Sign up first' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid Email or Password' });
    }

    if (!user.isVerified && user.role === 'user') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await otpModel.deleteMany({ email, action: 'account_verification' }); // Remove any existing OTPs for this email and action

      await otpModel.create({
        email,
        otp,
        action: 'account_verification',
      });

      await sendOtpEmail(email, otp, 'account_verification');
      return res.status(400).json({ error: 'Account not verified. Please check a new OTP has been sent to your email.' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token
    });
  }
  catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  registerUser,
  loginUser
}