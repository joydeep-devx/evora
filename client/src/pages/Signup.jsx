import React, { useContext, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { AuthContext } from '../context/AuthContext.jsx'
import FormField from '../components/ui/FormField'
import { getApiErrorMessage } from '../utils/apiError'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

const validate = ({ username, email, password }) => {
  const errors = {}
  if (!username.trim()) errors.username = 'Enter a username.'
  if (!email.trim()) errors.email = 'Enter your email.'
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.'
  if (password.length < MIN_PASSWORD_LENGTH) errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
  return errors
}

const Signup = () => {
  const { user, register } = useContext(AuthContext)
  const navigate = useNavigate()

  const [values, setValues] = useState({ username: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already logged in: nothing to sign up for.
  if (user) return <Navigate to="/" replace />

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
    // Clear a field's error as soon as the user edits it.
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
      await register(values.username.trim(), email, values.password)
      navigate('/verify-otp', { state: { email } })
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Could not create your account. Please try again.'))
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
          <h1 className="text-2xl sm:text-3xl font-bold text-main">Create your account</h1>
          <p className="text-muted">It takes a minute. We'll email you a code to verify it.</p>
        </div>

        {formError && (
          <div role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-on-danger-soft">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <FormField
            id="signup-username"
            name="username"
            label="Username"
            autoComplete="username"
            value={values.username}
            onChange={handleChange}
            error={errors.username}
          />
          <FormField
            id="signup-email"
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
          />
          <FormField
            id="signup-password"
            name="password"
            type="password"
            label="Password"
            autoComplete="new-password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          />

          <motion.button
            type="submit"
            disabled={submitting}
            className="mt-2 h-12 rounded-full bg-primary font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-70"
            whileHover={submitting ? undefined : { scale: 1.02 }}
            whileTap={submitting ? undefined : { scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </motion.button>
        </form>

        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:text-on-primary-soft transition-colors">Log in</Link>
        </p>
      </section>
    </motion.main>
  )
}

export default Signup
