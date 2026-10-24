import React, { useContext, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import api from '../utils/axios'
import { AuthContext } from '../context/AuthContext.jsx'
import { buttonSpring } from '../utils/motion'
import { formatEventDateTime } from '../utils/format'
import BookingPanel from '../components/events/BookingPanel'
import StateMessage from '../components/ui/StateMessage'

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 11h18" />
  </svg>
)

const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0" aria-hidden="true">
    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
)

const EventDetails = () => {
  const { id } = useParams()
  const { logout } = useContext(AuthContext)
  const [event, setEvent] = useState(null)
  // 'loading' | 'success' | 'notfound' | 'error' | 'login'
  const [status, setStatus] = useState('loading')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let ignore = false
    api.get(`/events/${id}`)
      .then(({ data }) => {
        if (ignore) return
        setEvent(data)
        setStatus('success')
      })
      .catch((error) => {
        if (ignore) return
        const code = error.response?.status
        // A malformed id currently makes the backend answer 500, so treat that as "not found" too.
        if (code === 404 || (code === 500 && !/^[a-f\d]{24}$/i.test(id))) setStatus('notfound')
        else if (code === 401) setStatus('login')
        else setStatus('error')
      })
    return () => {
      ignore = true
    }
  }, [id, reloadKey])

  const retry = () => {
    setStatus('loading')
    setReloadKey((key) => key + 1)
  }

  return (
    <motion.main
      className="max-w-7xl mx-auto px-4 py-8 md:py-10"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Link to="/events" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-main">
        ← All events
      </Link>

      {status === 'loading' && (
        <div aria-busy="true" aria-label="Loading event" className="flex flex-col gap-6">
          <div className="h-64 animate-pulse rounded-[28px] bg-border/60 md:h-80" />
          <div className="h-10 w-2/3 animate-pulse rounded-full bg-border/60" />
          <div className="h-5 w-1/2 animate-pulse rounded-full bg-border/60" />
        </div>
      )}

      {status === 'notfound' && (
        <StateMessage title="Event not found">
          <p className="text-muted">It may have been removed, or the link is wrong.</p>
          <Link to="/events" className="mt-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary">Browse events</Link>
        </StateMessage>
      )}

      {status === 'error' && (
        <StateMessage title="Couldn't load this event">
          <p className="text-muted">Check your connection and try again.</p>
          <motion.button type="button" onClick={retry} className="mt-2 rounded-full border-2 border-border bg-surface px-6 py-3 font-semibold text-main" {...buttonSpring}>
            Try again
          </motion.button>
        </StateMessage>
      )}

      {status === 'login' && (
        <StateMessage title="Your session has expired">
          <p className="text-muted">Please log in again to see this event.</p>
          <motion.button type="button" onClick={logout} className="mt-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary" {...buttonSpring}>
            Log in again
          </motion.button>
        </StateMessage>
      )}

      {status === 'success' && event && (
        <>
          <div className="mb-8 h-64 overflow-hidden rounded-[28px] bg-primary-soft md:h-96">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-on-primary-soft">No image</div>
            )}
          </div>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <article className="flex flex-col gap-5">
              <span className="self-start rounded-full bg-accent-soft px-3.5 py-1.5 text-sm font-semibold text-on-accent-soft">
                {event.category}
              </span>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight text-main">{event.title}</h1>
              <div className="flex flex-col gap-3 text-muted sm:flex-row sm:flex-wrap sm:gap-x-8">
                <span className="flex items-center gap-2"><CalendarIcon />{formatEventDateTime(event.date)}</span>
                <span className="flex items-center gap-2"><PinIcon />{event.location}</span>
              </div>
              <div className="mt-2 flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-main">About this event</h2>
                <p className="max-w-2xl whitespace-pre-line text-lg leading-relaxed text-main/80">{event.description}</p>
              </div>
            </article>

            {/* key: a fresh panel (and fresh booking state) for each event */}
            <BookingPanel key={event._id} event={event} />
          </div>
        </>
      )}
    </motion.main>
  )
}

export default EventDetails
