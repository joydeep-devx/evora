import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { buttonSpring } from '../../utils/motion'
import EventCard from '../EventCard'
import MotionLink from '../MotionLink'
import StateMessage from '../ui/StateMessage'
import EventGridSkeleton from '../ui/EventGridSkeleton'

const FEATURED_COUNT = 3

// A home-page row of up to 3 event cards. Reused for "Happening soon" and
// "Recently wrapped up": the parent loads the events once (useEvents) and
// passes the same result to each section along with its own filter.
//
// eventsState: { events, status, retry } from useEvents()
// select:      (events) => the events for this section, already sorted
// ended:       show the cards in their "event is over" style
// showStates:  render login / error messages (only one section should,
//              otherwise the same message appears twice)
// hideWhenEmpty: render nothing at all when there are no events to show
const FeaturedEvents = ({
  eventsState,
  select,
  headingId,
  title,
  subtitle,
  emptyTitle,
  emptyText,
  seeAllLink,
  ended = false,
  showStates = true,
  hideWhenEmpty = false,
}) => {
  const { events: allEvents, status, retry } = eventsState
  // Derived from the fetched list on every render, so it never goes stale.
  const events = select(allEvents).slice(0, FEATURED_COUNT)

  if (hideWhenEmpty && (status !== 'success' || events.length === 0)) return null
  if (!showStates && (status === 'login' || status === 'error')) return null

  return (
    <section aria-labelledby={headingId} className="pb-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={headingId} className="text-2xl md:text-3xl font-bold text-main">{title}</h2>
          <p className="mt-1 text-muted">{subtitle}</p>
        </div>
        {seeAllLink && status === 'success' && events.length > 0 && (
          <Link to={seeAllLink} className="font-semibold text-primary hover:text-on-primary-soft transition-colors">
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
        <StateMessage title={emptyTitle}>
          <p className="text-muted">{emptyText}</p>
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
              <EventCard event={event} ended={ended} />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  )
}

export default FeaturedEvents
