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


module.exports = {
  registerUser
}