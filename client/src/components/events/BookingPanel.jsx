import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import api from '../../utils/axios'
import { AuthContext } from '../../context/AuthContext.jsx'
import { buttonSpring } from '../../utils/motion'
import { formatPrice } from '../../utils/format'
import { getApiErrorMessage } from '../../utils/apiError'
import FormField from '../ui/FormField'

const OTP_LENGTH = 6

const primaryButton = 'h-12 w-full rounded-full bg-primary font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-70'

const StatusNote = ({ tone, children }) => {
  const tones = {
    pending: 'bg-warning-soft text-on-warning-soft',
    confirmed: 'bg-accent-soft text-on-accent-soft',
    neutral: 'bg-background text-muted',
  }
  return <p className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}>{children}</p>
}

// Finds this user's active (not cancelled) booking for the event, if any.
const useExistingBooking = (eventId, enabled) => {
  // undefined = still checking, null = none
  const [booking, setBooking] = useState(enabled ? undefined : null)

  useEffect(() => {
    if (!enabled) return
    let ignore = false
    api.get('/bookings/my')
      .then(({ data }) => {
        if (ignore) return
        const found = data.bookings.find(
          (b) => (b.eventId?._id ?? b.eventId) === eventId && b.status !== 'cancelled'
        )
        setBooking(found ?? null)
      })
      .catch(() => {
        // If this check fails, let the user try; the backend rejects duplicates anyway.
        if (!ignore) setBooking(null)
      })
    return () => {
      ignore = true
    }
  }, [eventId, enabled])

  return [booking, setBooking]
}

const BookingPanel = ({ event }) => {
  const { user } = useContext(AuthContext)
  const isAdmin = user?.role === 'admin'
  // Checked once when the panel mounts (keeps render pure).
  const [isPast] = useState(() => new Date(event.date) < new Date())
  const soldOut = event.availableSeats <= 0

  const [existing, setExisting] = useExistingBooking(event._id, !isAdmin)
  // 'start' -> 'code' (code emailed) ; busy = a request is in flight
  const [step, setStep] = useState('start')
  const [busy, setBusy] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

  const sendCode = async () => {
    setBusy(true)
    setFormError('')
    try {
      await api.post('/bookings/send-otp')
      setStep('code')
      setNotice(step === 'code' ? 'A new code is on its way.' : '')
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Could not send the code. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  const requestBooking = async (e) => {
    e.preventDefault()
    setFormError('')
    if (otp.length !== OTP_LENGTH) {
      setOtpError(`Enter the ${OTP_LENGTH}-digit code from your email.`)
      return
    }
    setBusy(true)
    try {
      const { data } = await api.post('/bookings', { eventId: event._id, otp })
      setExisting(data.booking)
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Could not book this event. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  const renderBody = () => {
    if (isAdmin) {
      return (
        <StatusNote tone="neutral">
          You're signed in as an admin. Bookings are managed from{' '}
          <Link to="/admin/bookings" className="font-semibold text-primary">Bookings</Link>.
        </StatusNote>
      )
    }
    if (existing === undefined) {
      return <div className="h-12 animate-pulse rounded-full bg-border/60" aria-label="Checking your bookings" />
    }
    if (existing) {
      return existing.status === 'confirmed' ? (
        <StatusNote tone="confirmed">
          <strong className="font-semibold">You're going!</strong> Your booking is confirmed.{' '}
          <Link to="/bookings/my" className="font-semibold underline">View my bookings</Link>
        </StatusNote>
      ) : (
        <StatusNote tone="pending">
          <strong className="font-semibold">Booking requested.</strong> It's pending until the organiser confirms it — we'll email you.{' '}
          <Link to="/bookings/my" className="font-semibold underline">View my bookings</Link>
        </StatusNote>
      )
    }
    if (isPast) {
      return <StatusNote tone="neutral">This event has already happened.</StatusNote>
    }
    if (soldOut) {
      return (
        <button type="button" disabled className="h-12 w-full rounded-full bg-border font-semibold text-muted">
          Sold out
        </button>
      )
    }
    if (step === 'start') {
      return (
        <div className="flex flex-col gap-3">
          <motion.button type="button" onClick={sendCode} disabled={busy} className={primaryButton} {...(busy ? {} : buttonSpring)}>
            {busy ? 'Sending code…' : 'Book a seat'}
          </motion.button>
          <p className="text-center text-sm text-muted">We'll email a 6-digit code to {user.email} to confirm it's you.</p>
        </div>
      )
    }
    return (
      <form onSubmit={requestBooking} noValidate className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          Code sent to <strong className="font-semibold text-main">{user.email}</strong> ·{' '}
          <button type="button" onClick={sendCode} disabled={busy} className="font-semibold text-primary disabled:opacity-60">
            Resend
          </button>
        </p>
        {notice && <p className="text-sm text-on-accent-soft" aria-live="polite">{notice}</p>}
        <FormField
          id="booking-otp"
          name="otp"
          label="Enter the 6-digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={OTP_LENGTH}
          placeholder="••••••"
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))
            setOtpError('')
          }}
          error={otpError}
          className="h-14 text-center text-2xl font-semibold tracking-[0.5em]"
        />
        <motion.button type="submit" disabled={busy} className={primaryButton} {...(busy ? {} : buttonSpring)}>
          {busy ? 'Requesting…' : 'Request booking'}
        </motion.button>
      </form>
    )
  }

  return (
    <aside className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-6 sm:p-7 lg:sticky lg:top-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-3xl font-bold text-main">
          {formatPrice(event.ticketPrice)}
          {event.ticketPrice > 0 && <span className="ml-1 text-sm font-normal text-muted">/ ticket</span>}
        </p>
        <p className={`text-sm font-semibold ${soldOut ? 'text-danger' : 'text-on-accent-soft'}`}>
          {soldOut ? 'Sold out' : `${event.availableSeats} of ${event.totalSeats} left`}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-border" aria-hidden="true">
        <div
          className="h-full rounded-full bg-on-accent-soft"
          style={{ width: `${Math.max(0, Math.min(100, (event.availableSeats / event.totalSeats) * 100))}%` }}
        />
      </div>

      {formError && (
        <div role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-on-danger-soft">
          {formError}
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={existing ? `booked-${existing.status}` : `${step}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {renderBody()}
        </motion.div>
      </AnimatePresence>

      {!isAdmin && !existing && !isPast && !soldOut && (
        <p className="text-xs leading-relaxed text-muted">
          Your booking starts as <strong className="font-semibold">pending</strong>. The organiser confirms it and you'll get an email.
        </p>
      )}
    </aside>
  )
}

export default BookingPanel
