const { rateLimit } = require('express-rate-limit');

const MINUTE = 60 * 1000;

const createLimiter = ({ minutes, max, message, ...options }) => rateLimit({
  windowMs: minutes * MINUTE,
  limit: max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message },
  ...options,
});

/**
 * Failed logins per IP. Successful logins don't count, so normal users are never blocked.
 * Unverified logins return 400 and email a new code, so this also limits those emails.
 */
const loginLimiter = createLimiter({
  minutes: 15,
  max: 10,
  skipSuccessfulRequests: true,
  message: 'Too many failed login attempts. Please try again in 15 minutes.',
});

/**
 * New accounts per IP. Each registration sends an email.
 */
const registerLimiter = createLimiter({
  minutes: 60,
  max: 10,
  message: 'Too many accounts created from this network. Please try again later.',
});

/**
 * Code checks per IP. Each code also has its own attempt limit (see otp.service.js).
 */
const verifyOtpLimiter = createLimiter({
  minutes: 15,
  max: 20,
  message: 'Too many attempts. Please try again in 15 minutes.',
});

/**
 * Booking code emails per user. Must run after protect, which sets req.user.
 */
const sendOtpLimiter = createLimiter({
  minutes: 10,
  max: 5,
  keyGenerator: (req) => req.user._id.toString(),
  message: 'Too many codes requested. Please wait a few minutes and try again.',
});

module.exports = { loginLimiter, registerLimiter, verifyOtpLimiter, sendOtpLimiter };
