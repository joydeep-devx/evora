import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import api from '../../utils/axios'
import { AuthContext } from '../../context/AuthContext.jsx'
import { buttonSpring } from '../../utils/motion'
import { formatEventDate, formatPrice } from '../../utils/format'
import { getApiErrorMessage } from '../../utils/apiError'
import { BookingStatusBadge, PaymentBadge } from '../../components/ui/StatusBadge'
import StateMessage from '../../components/ui/StateMessage'
import Select from '../../components/ui/Select'

const PAYMENT_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
]

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'cancelled', label: 'Cancelled' },
]

const PAGE_SIZE = 25

const Pagination = ({ page, pageCount, first, last, total, onChange }) => (
  <nav aria-label="Bookings pages" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
    <p className="text-muted">
      Showing <span className="font-semibold text-main">{first}–{last}</span> of{' '}
      <span className="font-semibold text-main">{total}</span>
    </p>
    {pageCount > 1 && (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="h-10 rounded-full border-2 border-border bg-surface px-4 font-semibold text-main transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Previous
        </button>
        <span className="px-2 text-muted" aria-live="polite">Page {page} of {pageCount}</span>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page === pageCount}
          className="h-10 rounded-full border-2 border-border bg-surface px-4 font-semibold text-main transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    )}
  </nav>
)

const smallButton ='h-10 rounded-full px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60'

const FilterTab = ({ label, count, active, onClick }) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    onClick={onClick}
    className={`relative isolate flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${active ? 'text-background' : 'text-main hover:bg-border/50'
      }`}
  >
    {active && (
      <motion.span
        layoutId="admin-booking-filter"
        aria-hidden="true"
        className="absolute inset-0 -z-10 rounded-full bg-main"
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
    )}
    {label}
    <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-background/20' : 'bg-border'}`}>{count}</span>
  </button>
)

const BookingActions = ({ booking, onUpdated }) => {
  const [paymentStatus, setPaymentStatus] = useState(booking.paymentStatus)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async (request, nextBooking) => {
    setBusy(true)
    setError('')
    try {
      const { data } = await request()
      onUpdated(data.booking ?? nextBooking)
    } catch (err) {
      setError(getApiErrorMessage(err, 'That didn\'t work. Please try again.'))
    } finally {
      setBusy(false)
      setConfirmingCancel(false)
    }
  }

  const confirm = () => run(() => api.put(`/bookings/${booking._id}`, { paymentStatus }))
  const cancel = () =>
    run(() => api.delete(`/bookings/${booking._id}`), { ...booking, status: 'cancelled' })

  let controls
  if (booking.status === 'pending') {
    controls = (
      <>
        {/* mr-3 adds breathing room between the dropdown and Confirm */}
        <div className="mr-3 flex items-center gap-2">
          <span aria-hidden="true" className="text-xs font-semibold uppercase tracking-wider text-muted">Payment</span>
          <Select
            value={paymentStatus}
            onChange={setPaymentStatus}
            options={PAYMENT_OPTIONS}
            disabled={busy}
            ariaLabel="Payment"
            className={paymentStatus === 'paid' ? 'border-accent-soft text-on-accent-soft' : 'border-input-border text-main hover:border-primary/40'}
          />
        </div>
        <motion.button type="button" onClick={confirm} disabled={busy} className={`${smallButton} bg-primary text-on-primary`} {...(busy ? {} : buttonSpring)}>
          {busy ? 'Confirming…' : 'Confirm'}
        </motion.button>
      </>
    )
  } else if (booking.status === 'confirmed') {
    controls = confirmingCancel ? (
      <>
        <span className="text-sm font-medium text-main">Cancel?</span>
        <button type="button" onClick={cancel} disabled={busy} className={`${smallButton} bg-danger text-on-primary`}>
          {busy ? 'Cancelling…' : 'Yes'}
        </button>
        <button type="button" onClick={() => setConfirmingCancel(false)} disabled={busy} className={`${smallButton} border-2 border-border text-main`}>
          No
        </button>
      </>
    ) : (
      <button type="button" onClick={() => setConfirmingCancel(true)} className={`${smallButton} border-2 border-border text-on-primary-soft hover:border-primary/40`}>
        Cancel
      </button>
    )
  } else {
    controls = <span className="text-sm text-muted">No action</span>
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-2">{controls}</div>
      {error && <span role="alert" className="text-xs font-medium text-danger">{error}</span>}
    </div>
  )
}

const AdminBookings = () => {
  const { logout } = useContext(AuthContext)
  const [bookings, setBookings] = useState([])
  // 'loading' | 'success' | 'error' | 'login'
  const [status, setStatus] = useState('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  // A new filter or search starts again from page 1.
  const changeFilter = (id) => {
    setFilter(id)
    setPage(1)
  }
  const changeQuery = (text) => {
    setQuery(text)
    setPage(1)
  }

  useEffect(() => {
    let ignore = false
    // As an admin, this endpoint returns everyone's bookings.
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

  const replaceBooking = (updated) =>
    setBookings((prev) => prev.map((b) => (b._id === updated._id ? { ...b, ...updated, userId: updated.userId ?? b.userId, eventId: updated.eventId ?? b.eventId } : b)))

  const counts = { all: bookings.length }
  for (const b of bookings) counts[b.status] = (counts[b.status] ?? 0) + 1

  const search = query.trim().toLowerCase()
  const visible = bookings.filter((b) => {
    if (filter !== 'all' && b.status !== filter) return false
    if (!search) return true
    return [b.userId?.username, b.userId?.email, b.eventId?.title]
      .some((text) => text?.toLowerCase().includes(search))
  })

  // Only one page of rows is rendered, so the table stays fast with thousands of bookings.
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  // Clamp: confirming or cancelling can shrink the filtered list under the current page.
  const currentPage = Math.min(page, pageCount)
  const firstIndex = (currentPage - 1) * PAGE_SIZE
  const pageRows = visible.slice(firstIndex, firstIndex + PAGE_SIZE)

  return (
    <motion.main
      className="max-w-7xl mx-auto px-4 py-10 md:py-14"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="mb-8 flex flex-col gap-1.5">
        <h1 className="text-3xl md:text-4xl font-bold text-main">Bookings</h1>
        <p className="text-muted">Confirm pending requests and record payment.</p>
      </div>

      {status === 'loading' && <div aria-busy="true" aria-label="Loading bookings" className="h-96 animate-pulse rounded-3xl bg-border/60" />}

      {status === 'error' && (
        <StateMessage title="Couldn't load bookings">
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
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Filter bookings by status" className="flex flex-wrap gap-1">
              {FILTERS.map((f) => (
                <FilterTab key={f.id} label={f.label} count={counts[f.id] ?? 0} active={filter === f.id} onClick={() => changeFilter(f.id)} />
              ))}
            </div>
            <label className="w-full sm:w-72">
              <span className="sr-only">Search bookings</span>
              <input
                type="search"
                value={query}
                onChange={(e) => changeQuery(e.target.value)}
                placeholder="Search name, email or event"
                className="h-11 w-full rounded-full border-2 border-input-border bg-surface px-4 text-sm text-main outline-none transition-colors placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary-soft"
              />
            </label>
          </div>

          {visible.length === 0 ? (
            <StateMessage title={bookings.length === 0 ? 'No bookings yet' : 'No bookings match'}>
              <p className="text-muted">
                {bookings.length === 0 ? 'Bookings appear here as soon as people request them.' : 'Try another filter or search.'}
              </p>
            </StateMessage>
          ) : (
            <>
            <div id="admin-bookings-table" className="overflow-x-auto rounded-3xl border border-border bg-surface">
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted">
                    <th scope="col" className="border-b border-border px-5 py-4 font-semibold">Attendee</th>
                    <th scope="col" className="border-b border-border px-3 py-4 font-semibold">Event</th>
                    <th scope="col" className="border-b border-border px-3 py-4 font-semibold">Amount</th>
                    <th scope="col" className="border-b border-border px-3 py-4 font-semibold">Status</th>
                    <th scope="col" className="border-b border-border px-5 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                    {pageRows.map((b) => (
                      <motion.tr
                        key={b._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="border-b border-border/60 last:border-b-0"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-main">{b.userId?.username ?? 'Deleted user'}</span>
                            <span className="text-xs text-muted">{b.userId?.email}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          {b.eventId ? (
                            <div className="flex flex-col">
                              <Link to={`/events/${b.eventId._id}`} className="font-medium text-main hover:text-primary">{b.eventId.title}</Link>
                              <span className="text-xs text-muted">{formatEventDate(b.eventId.date)} · {b.eventId.availableSeats} seats left</span>
                            </div>
                          ) : (
                            <span className="text-muted">Event deleted</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 font-semibold text-main">{formatPrice(b.amount)}</td>
                        <td className="px-3 py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            <BookingStatusBadge status={b.status} />
                            <PaymentBadge paymentStatus={b.paymentStatus} />
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <BookingActions booking={b} onUpdated={replaceBooking} />
                        </td>
                      </motion.tr>
                    ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              first={firstIndex + 1}
              last={firstIndex + pageRows.length}
              total={visible.length}
              onChange={(next) => {
                setPage(next)
                document.getElementById('admin-bookings-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            />
            </>
          )}
        </>
      )}
    </motion.main>
  )
}

export default AdminBookings
