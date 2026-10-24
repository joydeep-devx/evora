import React, { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'

// On-brand replacement for <select>. Native option lists are drawn by the OS
// (the blue highlight), so this renders its own listbox, with keyboard support.
// options: [{ value, label }]
// sm: compact pill (tables); md: matches FormField inputs (forms).
const SIZES = {
  sm: 'h-10 rounded-full text-sm font-semibold',
  md: 'h-12 w-full rounded-2xl text-base text-main',
}

// Name it with `ariaLabel`, or point `labelledBy` at a visible label's id.
const Select = ({ value, onChange, options, disabled = false, ariaLabel, labelledBy, size = 'sm', className = '' }) => {
  const id = useId()
  const buttonRef = useRef(null)
  const listRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [position, setPosition] = useState(null)

  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value))
  const selected = options[selectedIndex]

  const openList = () => {
    if (disabled) return
    const rect = buttonRef.current.getBoundingClientRect()
    // Fixed position + portal, so a scrolling table container can't clip the list.
    setPosition({ top: rect.bottom + 6, left: rect.left, minWidth: rect.width })
    setActiveIndex(selectedIndex)
    setOpen(true)
  }

  const close = (returnFocus = true) => {
    setOpen(false)
    if (returnFocus) buttonRef.current?.focus()
  }

  const choose = (option) => {
    if (option.value !== value) onChange(option.value)
    close()
  }

  // While open: focus the list, and close on outside click, scroll or resize.
  useEffect(() => {
    if (!open) return
    listRef.current?.focus()
    const onPointerDown = (e) => {
      if (!buttonRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) close(false)
    }
    const onViewportChange = (e) => {
      if (!listRef.current?.contains(e.target)) close(false)
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

  const onButtonKeyDown = (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault()
      openList()
    }
  }

  const onListKeyDown = (e) => {
    const last = options.length - 1
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(last, i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(0, i - 1))
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(last)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        choose(options[activeIndex])
        break
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'Tab':
        close(false)
        break
      default:
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        id={`${id}-button`}
        aria-label={ariaLabel && !labelledBy ? `${ariaLabel}: ${selected?.label}` : undefined}
        aria-labelledby={labelledBy ? `${labelledBy} ${id}-button` : undefined}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onButtonKeyDown}
        className={`relative flex items-center border-2 bg-surface pl-4 pr-9 outline-none ${SIZES[size]} transition-colors focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary-soft disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {selected?.label}
        <motion.svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          className="pointer-events-none absolute right-3 h-4 w-4 text-muted"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </motion.svg>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && position && (
            <motion.ul
              ref={listRef}
              id={`${id}-list`}
              role="listbox"
              tabIndex={-1}
              aria-label={labelledBy ? undefined : ariaLabel}
              aria-labelledby={labelledBy}
              aria-activedescendant={`${id}-opt-${activeIndex}`}
              onKeyDown={onListKeyDown}
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{ position: 'fixed', top: position.top, left: position.left, minWidth: position.minWidth }}
              className="z-50 origin-top rounded-2xl border border-border bg-surface p-1 font-sans shadow-lg shadow-main/10 outline-none"
            >
              {options.map((option, index) => {
                const isSelected = index === selectedIndex
                const isActive = index === activeIndex
                return (
                  <li
                    key={option.value}
                    id={`${id}-opt-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(option)}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary-soft text-on-primary-soft' : 'text-main'
                    }`}
                  >
                    {option.label}
                    <svg
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                      className={`h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`}
                      aria-hidden="true"
                    >
                      <path d="M5 12l5 5L19 7" />
                    </svg>
                  </li>
                )
              })}
            </motion.ul>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

export default Select
