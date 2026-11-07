const express = require('express');
const { registerUser , loginUser , verifyOtp } = require('../controllers/auth.controller');
const { loginLimiter, registerLimiter, verifyOtpLimiter } = require('../middlewares/rateLimit.middleware');


const router = express.Router();

router.post('/register',registerLimiter,registerUser);
router.post('/login',loginLimiter,loginUser);
router.post('/verify-otp',verifyOtpLimiter,verifyOtp);

module.exports = router;