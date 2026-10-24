import React from 'react'

// Labelled input with optional hint and error text, wired up for screen readers.
const FormField = ({ id, label, error, hint, className = '', ...inputProps }) => {
  const messageId = error || hint ? `${id}-message` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-main">{label}</label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={messageId}
        className={`h-12 rounded-2xl border-2 bg-surface px-4 text-main outline-none transition-colors placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary-soft ${error ? 'border-danger' : 'border-input-border'} ${className}`}
        {...inputProps}
      />
      {(error || hint) && (
        <p id={messageId} className={`text-sm ${error ? 'font-medium text-danger' : 'text-muted'}`}>
          {error || hint}
        </p>
      )}
    </div>
  )
}

export default FormField
