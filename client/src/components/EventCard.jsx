import { motion } from 'motion/react'
import MotionLink from './MotionLink'
import { formatEventDate, formatPrice, formatSeats } from '../utils/format'

// Expects an event object as returned by GET /api/events.
// ended: the event is over, so the card is muted and stops selling seats.
const EventCard = ({ event, ended = false }) => {
  const { _id, title, category, date, location, ticketPrice, availableSeats, imageUrl } = event

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className="group flex w-full flex-col overflow-hidden rounded-3xl border border-border bg-surface"
    >
      <div className="relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            // Past events fade to grey, and regain a little colour on hover.
            className={`h-44 w-full object-cover transition-[filter] duration-500 ${ended ? 'grayscale-[85%] group-hover:grayscale-[40%]' : ''}`}
          />
        ) : (
          <div className="flex h-44 flex-col items-center justify-center gap-2 bg-primary-soft text-on-primary-soft">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7" aria-hidden="true">
              <rect x="2" y="3" width="20" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m22 15-5-5L5 21" />
            </svg>
            <span className="text-sm">No image</span>
          </div>
        )}
        {ended && (
          <span className="absolute left-3 top-3 rounded-full bg-main/80 px-3 py-1 text-xs font-semibold text-background backdrop-blur-sm">
            Ended
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 pt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-on-accent-soft">
            {category}
          </span>
          <span className="text-sm text-muted">{formatEventDate(date)}</span>
        </div>

        <h3 className="mb-2 text-lg font-bold leading-6 text-main">{title}</h3>
        <p className="mb-4 text-sm text-muted">{location}</p>

        <div className="mt-auto flex items-center justify-between gap-3">
          <div>
            <p className={`text-lg font-extrabold ${ended ? 'text-muted' : 'text-main'}`}>{formatPrice(ticketPrice)}</p>
            <p className="text-xs text-muted">{ended ? 'This event is over' : formatSeats(availableSeats)}</p>
          </div>

          <MotionLink
            to={`/events/${_id}`}
            className={`flex items-center rounded-full px-5 py-3 text-sm font-semibold ${
              ended ? 'border-2 border-border bg-surface text-main' : 'bg-primary text-on-primary'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {ended ? 'View details' : 'View event'}
          </MotionLink>
        </div>
      </div>
    </motion.article>
  )
}

export default EventCard
