import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import api from '../../utils/axios'
import { AuthContext } from '../../context/AuthContext.jsx'
import { buttonSpring } from '../../utils/motion'
import { formatEventDate, formatPrice } from '../../utils/format'
import { getApiErrorMessage } from '../../utils/apiError'
import EventForm from '../../components/admin/EventForm'
import StateMessage from '../../components/ui/StateMessage'

const smallButton = 'h-9 rounded-full px-3.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60'

// Soonest first, past events last.
const sortEvents = (events, now) =>
  [...events].sort((a, b) => {
    const aPast = new Date(a.date) < now
    const bPast = new Date(b.date) < now
    if (aPast !== bPast) return aPast ? 1 : -1
    return new Date(a.date) - new Date(b.date)
  })

const EventRow = ({ event, activeBookings, isPast, isEditing, onEdit, onDeleted }) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const remove = async () => {
    setBusy(true)
    setError('')
    try {
      await api.delete(`/events/${event._id}`)
      onDeleted(event._id)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete this event.'))
      setBusy(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`border-b border-border/60 last:border-b-0 ${isEditing ? 'bg-primary-soft/40' : ''}`}
    >
      <td className="px-5 py-3.5">
        <div className="flex flex-col">
          <Link to={`/events/${event._id}`} className="font-semibold text-main hover:text-primary">{event.title}</Link>
          <span className="text-xs text-muted">
            {formatEventDate(event.date)} · {event.category}
            {isPast && <span className="ml-2 rounded-full bg-border px-2 py-0.5 font-semibold">Past</span>}
          </span>
        </div>
      </td>
      <td className="px-3 py-3.5 text-muted">
        <span className="font-semibold text-main">{event.availableSeats}</span> / {event.totalSeats}
      </td>
      <td className="px-3 py-3.5 text-muted">{activeBookings}</td>
      <td className="px-3 py-3.5 font-semibold text-main">{formatPrice(event.ticketPrice)}</td>
      <td className="px-5 py-3">
        <div className="flex flex-col items-end gap-1">
          <AnimatePresence mode="wait" initial={false}>
            {confirmingDelete ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-end gap-1.5"
              >
                {activeBookings > 0 && (
                  <span className="max-w-56 text-right text-xs text-on-danger-soft">
                    {activeBookings} active {activeBookings === 1 ? 'booking' : 'bookings'} will lose their event.
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-main">Delete?</span>
                  <button type="button" onClick={remove} disabled={busy} className={`${smallButton} bg-danger text-on-primary`}>
                    {busy ? 'Deleting…' : 'Yes'}
                  </button>
                  <button type="button" onClick={() => setConfirmingDelete(false)} disabled={busy} className={`${smallButton} border-2 border-border text-main`}>
                    No
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <button type="button" onClick={onEdit} className={`${smallButton} border-2 border-border text-main hover:border-primary/40`}>
                  Edit
                </button>
                <button type="button" onClick={() => setConfirmingDelete(true)} className={`${smallButton} bg-danger-soft text-on-danger-soft hover:bg-danger hover:text-on-primary`}>
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {error && <span role="alert" className="text-xs font-medium text-danger">{error}</span>}
        </div>
      </td>
    </motion.tr>
  )
}

const AdminEvents = () => {
  const { logout } = useContext(AuthContext)
  const [events, setEvents] = useState([])
  const [bookings, setBookings] = useState([])
  // 'loading' | 'success' | 'error' | 'login'
  const [status, setStatus] = useState('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [savedNotice, setSavedNotice] = useState('')
  // Captured once; keeps render pure.
  const [now] = useState(() => new Date())

  useEffect(() => {
    let ignore = false
    // Bookings are loaded only to show how many active bookings each event has.
    Promise.all([api.get('/events'), api.get('/bookings/my')])
      .then(([eventsRes, bookingsRes]) => {
        if (ignore) return
        setEvents(eventsRes.data)
        setBookings(bookingsRes.data.bookings)
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

  const activeCount = {}
  for (const b of bookings) {
    const id = b.eventId?._id ?? b.eventId
    if (id && b.status !== 'cancelled') activeCount[id] = (activeCount[id] ?? 0) + 1
  }

  const editing = events.find((e) => e._id === editingId) ?? null
  const categories = [...new Set(events.map((e) => e.category))]
  const sorted = sortEvents(events, now)

  const handleSaved = (saved, wasEdit) => {
    setEvents((prev) => (wasEdit ? prev.map((e) => (e._id === saved._id ? saved : e)) : [saved, ...prev]))
    setEditingId(null)
    setSavedNotice(wasEdit ? `Saved changes to "${saved.title}".` : `Created "${saved.title}".`)
  }

  const handleDeleted = (id) => {
    setEvents((prev) => prev.filter((e) => e._id !== id))
    if (editingId === id) setEditingId(null)
    setSavedNotice('Event deleted.')
  }

  const startEdit = (id) => {
    setEditingId(id)
    setSavedNotice('')
    // On small screens the form sits below the table, so bring it into view.
    document.getElementById('event-form-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <motion.main
      className="max-w-7xl mx-auto px-4 py-10 md:py-14"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="mb-8 flex flex-col gap-1.5">
        <h1 className="text-3xl md:text-4xl font-bold text-main">Manage events</h1>
        <p className="text-muted">Create, edit and remove events.</p>
      </div>

      {status === 'loading' && <div aria-busy="true" aria-label="Loading events" className="h-96 animate-pulse rounded-3xl bg-border/60" />}

      {status === 'error' && (
        <StateMessage title="Couldn't load events">
          <p className="text-muted">Check your connection and try again.</p>
          <motion.button type="button" onClick={retry} className="mt-2 rounded-full border-2 border-border bg-surface px-6 py-3 font-semibold text-main" {...buttonSpring}>
            Try again
          </motion.button>
        </StateMessage>
      )}

      {status === 'login' && (
        <StateMessage title="Your session has expired">
          <p className="text-muted">Please log in again.</p>
          <motion.button type="button" onClick={logout} className="mt-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary" {...buttonSpring}>
            Log in again
          </motion.button>
        </StateMessage>
      )}

      {status === 'success' && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section aria-labelledby="all-events-heading" className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="all-events-heading" className="text-xl font-semibold text-main">All events ({events.length})</h2>
              <AnimatePresence>
                {savedNotice && (
                  <motion.p
                    role="status"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-on-accent-soft"
                  >
                    {savedNotice}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {events.length === 0 ? (
              <StateMessage title="No events yet">
                <p className="text-muted">Create your first event with the form.</p>
              </StateMessage>
            ) : (
              <div className="overflow-x-auto rounded-3xl border border-border bg-surface">
                <table className="w-full min-w-[680px] border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-muted">
                      <th scope="col" className="border-b border-border px-5 py-4 font-semibold">Event</th>
                      <th scope="col" className="border-b border-border px-3 py-4 font-semibold">Seats left</th>
                      <th scope="col" className="border-b border-border px-3 py-4 font-semibold">Bookings</th>
                      <th scope="col" className="border-b border-border px-3 py-4 font-semibold">Price</th>
                      <th scope="col" className="border-b border-border px-5 py-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {sorted.map((event) => (
                        <EventRow
                          key={event._id}
                          event={event}
                          activeBookings={activeCount[event._id] ?? 0}
                          isPast={new Date(event.date) < now}
                          isEditing={event._id === editingId}
                          onEdit={() => startEdit(event._id)}
                          onDeleted={handleDeleted}
                        />
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* key: switching events (or back to "new") gives the form fresh state */}
          <EventForm
            key={editing?._id ?? 'new'}
            editing={editing}
            categories={categories}
            onSaved={handleSaved}
            onCancelEdit={() => setEditingId(null)}
          />
        </div>
      )}
    </motion.main>
  )
}

export default AdminEvents
