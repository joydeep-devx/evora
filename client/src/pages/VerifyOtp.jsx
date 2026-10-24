import React, { useContext, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { AuthContext } from '../context/AuthContext.jsx'
import FormField from '../components/ui/FormField'
import { getApiErrorMessage } from '../utils/apiError'

const OTP_LENGTH = 6
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const VerifyOtp = () => {
  const { user, verifyOtp } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()

  // Sign up (and an unverified login) pass the email along; otherwise ask for it.
  const emailFromState = location.state?.email ?? ''
  const [email, setEmail] = useState(emailFromState)
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleOtpChange = (event) => {
    // Digits only, max 6.
    setOtp(event.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))
    if (errors.otp) setErrors((prev) => ({ ...prev, otp: undefined }))
  }

  const handleEmailChange = (event) => {
    setEmail(event.target.value)
    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const fieldErrors = {}
    if (!EMAIL_PATTERN.test(email.trim())) fieldErrors.email = 'Enter the email you signed up with.'
    if (otp.length !== OTP_LENGTH) fieldErrors.otp = `Enter the ${OTP_LENGTH}-digit code from your email.`
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setSubmitting(true)
    try {
      await verifyOtp(email.trim().toLowerCase(), otp)
      navigate('/', { replace: true })
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'That code didn\'t work. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.main
      className="flex justify-center px-4 py-12 md:py-16"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <section className="flex w-full max-w-md flex-col items-center gap-6 rounded-3xl border border-border bg-surface p-6 text-center sm:p-9">
        {/* Pops in once, then the envelope gently floats like it just arrived. */}
        <motion.span
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
        >
          <motion.svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"
            animate={{ y: [0, -3, 0], rotate: [0, -4, 0] }}
            transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity, delay: 0.6 }}
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </motion.svg>
        </motion.span>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-main">Check your email</h1>
          <p className="text-muted">
            {emailFromState ? (
              <>We sent a {OTP_LENGTH}-digit code to <strong className="font-semibold text-main">{emailFromState}</strong>. </>
            ) : (
              <>Enter your email and the {OTP_LENGTH}-digit code we sent you. </>
            )}
            It expires in 5 minutes.
          </p>
        </div>

        {formError && (
          <div role="alert" className="w-full rounded-2xl bg-danger-soft px-4 py-3 text-left text-sm font-medium text-on-danger-soft">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-4 text-left">
          {!emailFromState && (
            <FormField
              id="verify-email"
              name="email"
              type="email"
              label="Email"
              autoComplete="email"
              value={email}
              onChange={handleEmailChange}
              error={errors.email}
            />
          )}
          <FormField
            id="verify-otp"
            name="otp"
            label="Verification code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            placeholder="••••••"
            value={otp}
            onChange={handleOtpChange}
            error={errors.otp}
            className="h-14 text-center text-2xl font-semibold tracking-[0.5em]"
          />

          <motion.button
            type="submit"
            disabled={submitting}
            className="mt-2 h-12 rounded-full bg-primary font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-70"
            whileHover={submitting ? undefined : { scale: 1.02 }}
            whileTap={submitting ? undefined : { scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {submitting ? 'Verifying…' : 'Verify account'}
          </motion.button>
        </form>

        <p className="text-sm text-muted">
          Didn't get it? Check your spam folder, or{' '}
          <Link to="/login" className="font-semibold text-primary hover:text-on-primary-soft transition-colors">log in again</Link>
          {' '}to get a new code.
        </p>
      </section>
    </motion.main>
  )
}

export default VerifyOtp
