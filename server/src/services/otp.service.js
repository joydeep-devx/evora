const otpModel = require('../models/otp.model');

const MAX_OTP_ATTEMPTS = 5;

/**
 * Checks a code and counts the attempt. After MAX_OTP_ATTEMPTS tries the code is deleted,
 * so a 6-digit code can't be guessed, even from many different IP addresses.
 * Returns the OTP record when the code is correct, otherwise null.
 */
const checkOtp = async (email, action, otp) => {
  // Counted in one atomic step, so parallel guesses can't get extra attempts.
  const record = await otpModel.findOneAndUpdate(
    { email, action, attempts: { $lt: MAX_OTP_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { returnDocument: 'after' }
  );
  if (!record) return null;
  if (record.otp === otp) return record;

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await otpModel.deleteOne({ _id: record._id });
  }
  return null;
};

module.exports = { checkOtp };
