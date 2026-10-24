// Display helpers for data coming from the API.

export const formatPrice = (amount) => {
  if (!amount) return 'Free'
  return "₹"+ amount.toLocaleString('en-IN')
}

export const formatEventDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

// "Friday, 13 November 2026 · 7:00 pm"
export const formatEventDateTime = (isoDate) => {
  const date = new Date(isoDate)
  const day = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const time = date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${day} · ${time}`
}

export const formatSeats =(availableSeats) =>
  availableSeats > 0 ? `${availableSeats} seats left` : 'Sold out'
