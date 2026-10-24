import React, { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { formatEventDateTime } from '../../utils/format'

// On-brand replacement for <input type="datetime-local">: a calendar plus time slots.
// value / onChange use the same local "YYYY-MM-DDTHH:mm" string as the native input.

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const POPOVER_WIDTH = 432
const POPOVER_HEIGHT_ESTIMATE = 420

const pad = (n) => String(n).padStart(2, '0')
const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parseValue = (value) => {
  if (!value) return null
  const [datePart, timePart = '19:00'] = value.split('T')
  return { date: datePart, time: timePart.slice(0, 5) }
}
const sameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()

// Every 30 minutes, plus the current time if it's off the grid (e.g. 18:44 from old data).
const buildTimeSlots = (current) => {
  const slots = []
  for (let h = 0; h < 24; h++) for (const m of [0, 30]) slots.push(`${pad(h)}:${pad(m)}`)
  if (current && !slots.includes(current)) slots.push(current)
  return slots.sort()
}

const formatSlot = (slot) => {
  const [h, m] = slot.split(':').map(Number)
  const suffix = h < 12 ? 'am' : 'pm'
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${suffix}`
}

// 6 weeks of days (Monday first) covering the month shown.
const buildMonthGrid = (month) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - offset)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

const DateTimePicker = ({ value, onChange, labelledBy, error, minDate, placeholder = 'Pick a date and time' }) => {
  const id = useId()
  const buttonRef = useRef(null)
  const popoverRef = useRef(null)
  const scrollToTimeRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const parsed = parseValue(value)
  const [viewMonth, setViewMonth] = useState(() => (parsed ? new Date(`${parsed.date}T00:00`) : new Date()))
  const [todayKey] = useState(() => toDateKey(new Date()))

  const selectedTime = parsed?.time ?? '19:00'
  const timeSlots = buildTimeSlots(parsed?.time)
  const days = buildMonthGrid(viewMonth)

  const openPopover = () => {
    const rect = buttonRef.current.getBoundingClientRect()
    if (window.innerWidth < 640) {
      // Phones: a sheet pinned to the bottom of the screen, so it always fits.
      setPosition({ bottom: 16, left: 16, width: window.innerWidth - 32 })
    } else {
      const width = Math.min(POPOVER_WIDTH, window.innerWidth - 32)
      const left = Math.max(16, Math.min(rect.left, window.innerWidth - width - 16))
      const fitsBelow = rect.bottom + POPOVER_HEIGHT_ESTIMATE < window.innerHeight
      setPosition(fitsBelow ? { top: rect.bottom + 6, left, width } : { bottom: window.innerHeight - rect.top + 6, left, width })
    }
    setViewMonth(parsed ? new Date(`${parsed.date}T00:00`) : new Date())
    scrollToTimeRef.current = selectedTime
    setOpen(true)
  }

  const close = (returnFocus = true) => {
    setOpen(false)
    if (returnFocus) buttonRef.current?.focus()
  }

  const pickDay = (day) => onChange(`${toDateKey(day)}T${selectedTime}`)
  const pickTime = (slot) => {
    onChange(`${parsed?.date ?? todayKey}T${slot}`)
    close()
  }

  // While open: focus the selected (or today's) day, close on outside click / page scroll / resize.
  useEffect(() => {
    if (!open) return
    const focusTarget =
      popoverRef.current?.querySelector('[data-day][aria-pressed="true"]') ??
      popoverRef.current?.querySelector('[data-day][data-today="true"]') ??
      popoverRef.current?.querySelector('[data-day]:not(:disabled)')
    focusTarget?.focus()
    // Show the chosen time (or the 7:00 pm default) instead of midnight.
    popoverRef.current?.querySelector(`[data-slot="${scrollToTimeRef.current}"]`)?.scrollIntoView({ block: 'center' })

    const onPointerDown = (e) => {
      if (!buttonRef.current?.contains(e.target) && !popoverRef.current?.contains(e.target)) close(false)
    }
    const onViewportChange = (e) => {
      if (!popoverRef.current?.contains(e.target)) close(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('scroll', onViewportChange, true)
      window.removeEventListener('resize', onViewportChange)
    }
  }, [open])

  const shiftMonth = (delta) => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))

  // Day to focus once a month change has rendered.
  const pendingFocusRef = useRef(null)
  useEffect(() => {
    if (!pendingFocusRef.current) return
    popoverRef.current?.querySelector(`[data-day="${pendingFocusRef.current}"]`)?.focus()
    pendingFocusRef.current = null
  }, [viewMonth])

  // Arrow keys move between days (±1 day, ±1 week), crossing months as needed.
  const onDayKeyDown = (e, day) => {
    const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    if (!(e.key in steps)) return
    e.preventDefault()
    const next = new Date(day)
    next.setDate(day.getDate() + steps[e.key])
    const nextKey = toDateKey(next)
    if (sameMonth(next, viewMonth)) {
      popoverRef.current?.querySelector(`[data-day="${nextKey}"]`)?.focus()
    } else {
      pendingFocusRef.current = nextKey
      setViewMonth(new Date(next.getFullYear(), next.getMonth(), 1))
    }
  }

  const onPopoverKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  const display = value ? formatEventDateTime(new Date(value)) : placeholder

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={labelledBy ? `${labelledBy} ${id}-value` : undefined}
        aria-invalid={error ? true : undefined}
        onClick={() => (open ? close() : openPopover())}
        className={`flex h-12 w-full items-center gap-3 rounded-2xl border-2 bg-surface px-4 text-left outline-none transition-colors focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary-soft ${
          error ? 'border-danger' : 'border-input-border hover:border-primary/40'
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 text-muted" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18" />
        </svg>
        <span id={`${id}-value`} className={`truncate ${value ? 'text-main' : 'text-muted/70'}`}>{display}</span>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && position && (
            <motion.div
              ref={popoverRef}
              role="dialog"
              aria-label="Choose date and time"
              onKeyDown={onPopoverKeyDown}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{ position: 'fixed', ...position }}
              className="z-50 flex flex-col gap-4 rounded-3xl border border-border bg-surface p-4 font-sans shadow-xl shadow-main/10 sm:flex-row"
            >
              {/* Calendar */}
              <div className="flex-1">
                <div className="mb-3 flex items-center justify-between">
                  <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-full text-main transition-colors hover:bg-primary-soft">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
                  </button>
                  <p className="text-sm font-semibold text-main" aria-live="polite">
                    {viewMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </p>
                  <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="flex h-9 w-9 items-center justify-center rounded-full text-main transition-colors hover:bg-primary-soft">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center" role="grid">
                  {WEEKDAYS.map((d) => (
                    <span key={d} className="pb-1 text-[11px] font-semibold uppercase text-muted" aria-hidden="true">{d}</span>
                  ))}
                  {days.map((day) => {
                    const key = toDateKey(day)
                    const isSelected = parsed?.date === key
                    const isToday = key === todayKey
                    const inMonth = sameMonth(day, viewMonth)
                    const isDisabled = Boolean(minDate) && key < minDate
                    return (
                      <button
                        key={key}
                        type="button"
                        data-day={key}
                        data-today={isToday}
                        aria-pressed={isSelected}
                        aria-label={day.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        disabled={isDisabled}
                        onClick={() => pickDay(day)}
                        onKeyDown={(e) => onDayKeyDown(e, day)}
                        className={`flex h-9 items-center justify-center rounded-full text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-30 ${
                          isSelected
                            ? 'bg-primary font-semibold text-on-primary'
                            : `${inMonth ? 'text-main' : 'text-muted/50'} ${isToday ? 'font-semibold ring-2 ring-inset ring-primary-soft' : ''} hover:bg-primary-soft hover:text-on-primary-soft`
                        }`}
                      >
                        {day.getDate()}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time slots */}
              <div className="flex flex-col sm:w-28">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Time</p>
                <div className="grid max-h-32 grid-cols-4 gap-1 overflow-y-auto pr-1 sm:max-h-72 sm:grid-cols-1">
                  {timeSlots.map((slot) => {
                    const isSelected = parsed?.time === slot
                    return (
                      <button
                        key={slot}
                        type="button"
                        data-slot={slot}
                        aria-pressed={isSelected}
                        onClick={() => pickTime(slot)}
                        className={`rounded-xl px-2 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary ${
                          isSelected ? 'bg-primary font-semibold text-on-primary' : 'text-main hover:bg-primary-soft hover:text-on-primary-soft'
                        }`}
                      >
                        {formatSlot(slot)}
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

export default DateTimePicker
