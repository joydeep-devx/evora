// Display helpers for data coming from the API.

export const formatPrice = (amount) => {
  if (!amount) return 'Free'
  return amount.toLocaleString('en-US')
}

export const formatEventDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

export const formatSeats = (availableSeats) =>
  availableSeats > 0 ? `${availableSeats} seats left` : 'Sold out'
