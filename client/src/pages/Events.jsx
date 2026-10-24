import React, { useContext } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { AuthContext } from '../context/AuthContext.jsx'
import { useEvents, upcomingEvents } from '../hooks/useEvents'
import { buttonSpring } from '../utils/motion'
import EventCard from '../components/EventCard'
import StateMessage from '../components/ui/StateMessage'
import EventGridSkeleton from '../components/ui/EventGridSkeleton'

const CategoryChip = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`relative isolate h-11 rounded-full border-2 px-5 text-sm font-semibold transition-colors ${
      active ? 'border-transparent text-background' : 'border-input-border bg-surface text-main hover:border-primary/40'
    }`}
  >
    {active && (
      <motion.span
        layoutId="category-chip"
        aria-hidden="true"
        className="absolute -inset-0.5 -z-10 rounded-full bg-main"
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
    )}
    {label}
  </button>
)

const Events = () => {
  const { logout } = useContext(AuthContext)
  const { events: allEvents, status, retry } = useEvents()
  // The selected category lives in the URL (?category=Music) so footer links and shared URLs work.
  const [searchParams, setSearchParams] = useSearchParams()
  const selected = searchParams.get('category')

  // The backend ignores category filters, so we filter here.
  const upcoming = upcomingEvents(allEvents)
  const categories = [...new Set(upcoming.map((event) => event.category))].sort()
  if (selected && !categories.includes(selected)) categories.push(selected)
  const visible = selected ? upcoming.filter((event) => event.category === selected) : upcoming

  const selectCategory = (category) => {
    setSearchParams(category ? { category } : {})
  }

  return (
    <motion.main
      className="max-w-7xl mx-auto px-4 py-10 md:py-14"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="mb-8 flex flex-col gap-1.5">
        <h1 className="text-3xl md:text-4xl font-bold text-main">Upcoming events</h1>
        <p className="text-muted" aria-live="polite">
          {status === 'success'
            ? `${visible.length} ${visible.length === 1 ? 'event' : 'events'}${selected ? ` in ${selected}` : ''} · pick one to see details and book.`
            : 'Find something to do this week.'}
        </p>
      </div>

      {status === 'success' && upcoming.length > 0 && (
        <div role="group" aria-label="Filter by category" className="mb-8 flex flex-wrap gap-2">
          <CategoryChip label="All" active={!selected} onClick={() => selectCategory(null)} />
          {categories.map((category) => (
            <CategoryChip
              key={category}
              label={category}
              active={selected === category}
              onClick={() => selectCategory(category)}
            />
          ))}
        </div>
      )}

      {status === 'loading' && <EventGridSkeleton count={6} />}

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

      {status === 'login' && (
        <StateMessage title="Your session has expired">
          <p className="text-muted">Please log in again to see events.</p>
          <motion.button
            type="button"
            onClick={logout}
            className="mt-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary"
            {...buttonSpring}
          >
            Log in again
          </motion.button>
        </StateMessage>
      )}

      {status === 'success' && visible.length === 0 && (
        <StateMessage title={selected ? `No upcoming ${selected} events` : 'No upcoming events yet'}>
          <p className="text-muted">
            {selected ? 'Try another category or check back soon.' : 'Check back soon — new events are added regularly.'}
          </p>
          {selected && (
            <motion.button
              type="button"
              onClick={() => selectCategory(null)}
              className="mt-2 rounded-full border-2 border-border bg-surface px-6 py-3 font-semibold text-main"
              {...buttonSpring}
            >
              Show all events
            </motion.button>
          )}
        </StateMessage>
      )}

      {status === 'success' && visible.length > 0 && (
        <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((event) => (
              <motion.div
                key={event._id}
                layout
                className="flex"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.main>
  )
}

export default Events
