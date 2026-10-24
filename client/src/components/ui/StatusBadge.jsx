import React from 'react'

const BOOKING_STYLES = {
  pending: 'bg-warning-soft text-on-warning-soft',
  confirmed: 'bg-accent-soft text-on-accent-soft',
  cancelled: 'bg-border text-muted',
}

const LABELS = { pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled' }

// Booking status pill: pending / confirmed / cancelled.
export const BookingStatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${BOOKING_STYLES[status] ?? BOOKING_STYLES.cancelled}`}>
    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
    {LABELS[status] ?? status}
  </span>
)

// Payment pill: outlined so it reads as secondary to the status.
export const PaymentBadge = ({ paymentStatus }) => (
  <span
    className={`inline-flex rounded-full border-2 px-3 py-0.5 text-xs font-semibold ${
      paymentStatus === 'paid' ? 'border-accent-soft text-on-accent-soft' : 'border-input-border text-muted'
    }`}
  >
    {paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
  </span>
)
