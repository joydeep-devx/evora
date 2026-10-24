import React, { useContext, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { AuthContext } from '../context/AuthContext.jsx'
import FormField from '../components/ui/FormField'
import { getApiErrorMessage } from '../utils/apiError'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// The backend answers an unverified login with a 400 and emails a fresh code.
// It has no error code for this, so we recognise it by its message.
const isUnverifiedError = (error) =>
  error.response?.status === 400 && /not verified/i.test(error.response.data?.error ?? '')

const validate = ({ email, password }) => {
  const errors = {}
  if (!email.trim()) errors.email = 'Enter your email.'
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.'
  if (!password) errors.password = 'Enter your password.'
  return errors
}

const Login = () => {
  const { user, login } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  // Where to go after logging in (set by ProtectedRoute), keeping any ?query.
  const from = location.state?.from
  const redirectTo = from ? `${from.pathname}${from.search ?? ''}` : '/'

  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={redirectTo} replace />

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const fieldErrors = validate(values)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    const email = values.email.trim().toLowerCase()
    setSubmitting(true)
    try {
      await login(email, values.password)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      if (isUnverifiedError(error)) {
        navigate('/verify-otp', { state: { email } })
        return
      }
      // Same message for unknown email and wrong password, so we don't reveal which accounts exist.
      setFormError(
        error.response?.status === 400
          ? 'Invalid email or password.'
          : getApiErrorMessage(error, 'Could not log you in. Please try again.')
      )
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
      <section className="flex w-full max-w-md flex-col gap-6 rounded-3xl border border-border bg-surface p-6 sm:p-9">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-main">Welcome back</h1>
          <p className="text-muted">Log in to book events and see your bookings.</p>
        </div>

        {formError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-on-danger-soft">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <FormField
            id="login-email"
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
          />
          <FormField
            id="login-password"
            name="password"
            type="password"
            label="Password"
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
          />

          <motion.button
            type="submit"
            disabled={submitting}
            className="mt-2 h-12 rounded-full bg-primary font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-70"
            whileHover={submitting ? undefined : { scale: 1.02 }}
            whileTap={submitting ? undefined : { scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {submitting ? 'Logging in…' : 'Log in'}
          </motion.button>
        </form>

        <p className="text-center text-sm text-muted">
          New to Evora?{' '}
          <Link to="/register" className="font-semibold text-primary hover:text-on-primary-soft transition-colors">Create an account</Link>
        </p>
      </section>
    </motion.main>
  )
}

export default Login
