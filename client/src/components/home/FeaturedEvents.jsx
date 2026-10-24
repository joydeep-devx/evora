import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import api from '../../utils/axios'
import { AuthContext } from '../../context/AuthContext.jsx'
import EventCard from '../EventCard'
import MotionLink from '../MotionLink'

const FEATURED_COUNT = 3

const buttonSpring = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
}

// Soonest upcoming events first.
const pickUpcoming = (events) =>
  events
    .filter((event) => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, FEATURED_COUNT)

const Message = ({ title, children }) => (
  <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-border px-6 py-12 text-center">
    <p className="text-lg font-semibold text-main">{title}</p>
    {children}
  </div>
)

const FeaturedEvents = () => {
  const { user } = useContext(AuthContext)
  const [events, setEvents] = useState([])
  // 'loading' | 'success' | 'login' | 'error'
  const [status, setStatus] = useState('loading')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let ignore = false

    api.get('/events')
      .then(({ data }) => {
        if (ignore) return
        setEvents(pickUpcoming(data))
        setStatus('success')
      })
      .catch((error) => {
        if (ignore) return
        // The events API currently requires a login, so guests get a 401.
        setStatus(error.response?.status === 401 ? 'login' : 'error')
      })

    return () => {
      ignore = true
    }
  }, [user, reloadKey])

  const retry = () => {
    setStatus('loading')
    setReloadKey((key) => key + 1)
  }

  return (
    <section aria-labelledby="featured-heading" className="pb-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="featured-heading" className="text-2xl md:text-3xl font-bold text-main">Happening soon</h2>
          <p className="mt-1 text-muted">Grab a seat before they're gone.</p>
        </div>
        {status === 'success' && events.length > 0 && (
          <Link to="/events" className="font-semibold text-primary hover:text-on-primary-soft transition-colors">
            See all events →
          </Link>
        )}
      </div>

      {status === 'loading' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading events">
          {Array.from({ length: FEATURED_COUNT }, (_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-3xl bg-border/60" />
          ))}
        </div>
      )}

      {status === 'login' && (
        <Message title="Log in to see what's on">
          <p className="max-w-sm text-muted">Create a free account or log in to browse events and book your seat.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <MotionLink to="/login" className="rounded-full bg-primary px-6 py-3 font-semibold text-on-primary" {...buttonSpring}>
              Log in
            </MotionLink>
            <MotionLink to="/register" className="rounded-full border-2 border-border bg-surface px-6 py-3 font-semibold text-main" {...buttonSpring}>
              Create an account
            </MotionLink>
          </div>
        </Message>
      )}

      {status === 'error' && (
        <Message title="Couldn't load events">
          <p className="text-muted">Check your connection and try again.</p>
          <motion.button
            type="button"
            onClick={retry}
            className="mt-2 rounded-full border-2 border-border bg-surface px-6 py-3 font-semibold text-main"
            {...buttonSpring}
          >
            Try again
          </motion.button>
        </Message>
      )}

      {status === 'success' && events.length === 0 && (
        <Message title="No upcoming events yet">
          <p className="text-muted">Check back soon — new events are added regularly.</p>
        </Message>
      )}

      {status === 'success' && events.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => (
            <motion.div
              key={event._id}
              className="flex"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.08 }}
            >
              <EventCard event={event} />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  )
}

export default FeaturedEvents
