import React from 'react'

// Labelled input (or textarea with `multiline`) with optional hint and error text,
// wired up for screen readers.
const FormField = ({ id, label, error, hint, multiline = false, className = '', ...inputProps }) => {
  const messageId = error || hint ? `${id}-message` : undefined
  const Control = multiline ? 'textarea' : 'input'

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-main">{label}</label>
      <Control
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={messageId}
        className={`rounded-2xl border-2 bg-surface px-4 text-main outline-none transition-colors placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary-soft ${multiline ? 'min-h-28 resize-y py-3' : 'h-12'} ${error ? 'border-danger' : 'border-input-border'} ${className}`}
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
