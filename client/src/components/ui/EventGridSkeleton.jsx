import React from 'react'

// Placeholder cards shown while events load.
const EventGridSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading events">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="h-80 animate-pulse rounded-3xl bg-border/60" />
    ))}
  </div>
)

export default EventGridSkeleton
