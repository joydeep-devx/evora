import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import api from '../utils/axios'
import { AuthContext } from '../context/AuthContext.jsx'
import { buttonSpring } from '../utils/motion'
import { formatPrice } from '../utils/format'
import { getApiErrorMessage } from '../utils/apiError'
import { BookingStatusBadge, PaymentBadge } from '../components/ui/StatusBadge'
import StateMessage from '../components/ui/StateMessage'
import MotionLink from '../components/MotionLink'

const eventTime = (booking) => new Date(booking.eventId?.date ?? 0).getTime()

// Upcoming bookings first (soonest first), then past events (most recent first),
// then cancelled bookings.
const sortBookings = (bookings, now) => {
  const group = (b) => {
    if (b.status === 'cancelled') return 2
    return eventTime(b) >= now ? 0 : 1
  }
  return [...bookings].sort((a, b) => {
    if (group(a) !== group(b)) return group(a) - group(b)
    return group(a) === 1 ? eventTime(b) - eventTime(a) : eventTime(a) - eventTime(b)
  })
}

const DateTile = ({ date }) => {
  const d = date ? new Date(date) : null
  return (
    <span aria-hidden="true" className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary-soft leading-tight text-on-primary-soft">
      <span className="text-lg font-bold">{d ? d.getDate() : '—'}</span>
      <span className="text-[11px] font-semibold uppercase">{d ? d.toLocaleDateString('en-GB', { month: 'short' }) : ''}</span>
    </span>
  )
}

// isPast: the event already happened, so the booking can't be cancelled any more.
const BookingRow = ({ booking, isPast, onCancelled }) => {
  const event = booking.eventId // populated event, or null if it was deleted
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const cancel = async () => {
    setBusy(true)
    setError('')
    try {
      await api.delete(`/bookings/${booking._id}`)
      onCancelled(booking._id)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not cancel this booking.'))
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex flex-wrap items-center gap-4 rounded-3xl border border-border bg-surface p-4 sm:p-5 ${booking.status === 'cancelled' ? 'opacity-70' : ''}`}
    >
      <DateTile date={event?.date} />

      <div className="flex min-w-0 flex-[999_1_14rem] flex-col gap-1">
        {event ? (
          <Link to={`/events/${event._id}`} className="truncate text-lg font-semibold text-main transition-colors hover:text-primary">
            {event.title}
          </Link>
        ) : (
          <span className="text-lg font-semibold text-muted">Event no longer available</span>
        )}
        <span className="text-sm text-muted">
          {event?.location ? `${event.location} · ` : ''}{formatPrice(booking.amount)}
        </span>
        {error && <span role="alert" className="text-sm font-medium text-danger">{error}</span>}
      </div>

      <div className="flex flex-auto flex-wrap items-center justify-end gap-2">
        <BookingStatusBadge status={booking.status} />
        <PaymentBadge paymentStatus={booking.paymentStatus} />

        {isPast && booking.status !== 'cancelled' && (
          <span className="px-2 text-sm text-muted">Event ended</span>
        )}

        {!isPast && booking.status !== 'cancelled' && (
          <AnimatePresence mode="wait" initial={false}>
            {confirming ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2"
              >
                <span className="text-sm font-medium text-main">Cancel booking?</span>
                <button
                  type="button"
                  onClick={cancel}
                  disabled={busy}
                  className="h-10 rounded-full bg-danger px-4 text-sm font-semibold text-on-primary disabled:opacity-70"
                >
                  {busy ? 'Cancelling…' : 'Yes, cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={busy}
                  className="h-10 rounded-full border-2 border-border px-4 text-sm font-semibold text-main"
                >
                  Keep
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="cancel"
                type="button"
                onClick={() => setConfirming(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-10 rounded-full border-2 border-border bg-surface px-4 text-sm font-semibold text-on-primary-soft transition-colors hover:border-primary/40"
              >
                Cancel
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.li>
  )
}

const MyBookings = () => {
  const { logout } = useContext(AuthContext)
  const [bookings, setBookings] = useState([])
  // 'loading' | 'success' | 'error' | 'login'
  const [status, setStatus] = useState('loading')
  const [reloadKey, setReloadKey] = useState(0)
  // Captured once; keeps render pure.
  const [now] = useState(() => Date.now())

  useEffect(() => {
    let ignore = false
    api.get('/bookings/my')
      .then(({ data }) => {
        if (ignore) return
        setBookings(data.bookings)
        setStatus('success')
      })
      .catch((error) => {
        if (ignore) return
        setStatus(error.response?.status === 401 ? 'login' : 'error')
      })
    return () => {
      ignore = true
    }
  }, [reloadKey])

  const retry = () => {
    setStatus('loading')
    setReloadKey((key) => key + 1)
  }

  // Update the list in place instead of refetching.
  const markCancelled = (id) =>
    setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status: 'cancelled' } : b)))

  const sorted = sortBookings(bookings, now)

  return (
    <motion.main
      className="max-w-4xl mx-auto px-4 py-10 md:py-14"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="mb-8 flex flex-col gap-1.5">
        <h1 className="text-3xl md:text-4xl font-bold text-main">My bookings</h1>
        <p className="text-muted">Pending bookings are waiting for the organiser to confirm.</p>
      </div>

      {status === 'loading' && (
        <ul aria-busy="true" aria-label="Loading bookings" className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => <li key={i} className="h-24 animate-pulse rounded-3xl bg-border/60" />)}
        </ul>
      )}

      {status === 'error' && (
        <StateMessage title="Couldn't load your bookings">
          <p className="text-muted">Check your connection and try again.</p>
          <motion.button type="button" onClick={retry} className="mt-2 rounded-full border-2 border-border bg-surface px-6 py-3 font-semibold text-main" {...buttonSpring}>
            Try again
          </motion.button>
        </StateMessage>
      )}

      {status === 'login' && (
        <StateMessage title="Your session has expired">
          <p className="text-muted">Please log in again to see your bookings.</p>
          <motion.button type="button" onClick={logout} className="mt-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary" {...buttonSpring}>
            Log in again
          </motion.button>
        </StateMessage>
      )}

      {status === 'success' && sorted.length === 0 && (
        <StateMessage title="No bookings yet">
          <p className="text-muted">When you book an event it shows up here.</p>
          <MotionLink to="/events" className="mt-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary" {...buttonSpring}>
            Browse events
          </MotionLink>
        </StateMessage>
      )}

      {status === 'success' && sorted.length > 0 && (
        <ul className="flex flex-col gap-3">
          {sorted.map((booking) => (
            <BookingRow key={booking._id} booking={booking} isPast={eventTime(booking) < now} onCancelled={markCancelled} />
          ))}
        </ul>
      )}
    </motion.main>
  )
}

export default MyBookings
