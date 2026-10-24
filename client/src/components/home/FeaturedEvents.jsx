import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useEvents, upcomingEvents } from '../../hooks/useEvents'
import { buttonSpring } from '../../utils/motion'
import EventCard from '../EventCard'
import MotionLink from '../MotionLink'
import StateMessage from '../ui/StateMessage'
import EventGridSkeleton from '../ui/EventGridSkeleton'

const FEATURED_COUNT = 3

const FeaturedEvents = () => {
  const { events: allEvents, status, retry } = useEvents()
  // Derived from the fetched list on every render, so it never goes stale.
  const events = upcomingEvents(allEvents).slice(0, FEATURED_COUNT)

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

      {status === 'loading' && <EventGridSkeleton count={FEATURED_COUNT} />}

      {status === 'login' && (
        <StateMessage title="Log in to see what's on">
          <p className="max-w-sm text-muted">Create a free account or log in to browse events and book your seat.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <MotionLink to="/login" className="rounded-full bg-primary px-6 py-3 font-semibold text-on-primary" {...buttonSpring}>
              Log in
            </MotionLink>
            <MotionLink to="/register" className="rounded-full border-2 border-border bg-surface px-6 py-3 font-semibold text-main" {...buttonSpring}>
              Create an account
            </MotionLink>
          </div>
        </StateMessage>
      )}

      {status === 'error' && (
        <StateMessage title="Couldn't load events">
          <p className="text-muted">Check your connection and try again.</p>
          <motion.button
            type="button"
            onClick={retry}
            className="mt-2 rounded-full border-2 border-border bg-surface px-6 py-3 font-semibold text-main"
            {...buttonSpring}
          >
            Try again
          </motion.button>
        </StateMessage>
      )}

      {status === 'success' && events.length === 0 && (
        <StateMessage title="No upcoming events yet">
          <p className="text-muted">Check back soon — new events are added regularly.</p>
        </StateMessage>
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
