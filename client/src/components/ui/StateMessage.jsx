import React from 'react'

// Dashed placeholder box for empty, error and logged-out states.
const StateMessage = ({ title, children }) => (
  <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-border px-6 py-12 text-center">
    <p className="text-lg font-semibold text-main">{title}</p>
    {children}
  </div>
)

export default StateMessage
