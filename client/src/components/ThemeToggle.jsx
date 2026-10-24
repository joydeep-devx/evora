import React, { useEffect, useId, useState } from 'react'
import { motion } from 'motion/react'

const STORAGE_KEY = 'theme'

const readSaved = () => {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

// index.html already set the class before React loaded; start from that.
const currentTheme = () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light')

const applyTheme = (theme) => {
  const root = document.documentElement
  // Fade colours for a moment instead of snapping (see .theme-transition in index.css).
  root.classList.add('theme-transition')
  root.classList.toggle('dark', theme === 'dark')
  window.setTimeout(() => root.classList.remove('theme-transition'), 400)
}

const spring = { type: 'spring', stiffness: 260, damping: 20 }

// Sun ↔ moon: the sun's core grows and a "bite" circle slides in to carve the
// crescent, while the rays shrink and spin away.
const ThemeToggle = () => {
  const [theme, setTheme] = useState(currentTheme)
  const isDark = theme === 'dark'
  // useId can contain characters that break url(#id) in SVG, so keep it plain.
  const maskId = `moon-mask-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  // Follow the OS setting live, unless the user has picked a theme here.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => {
      if (readSaved()) return
      const next = e.matches ? 'dark' : 'light'
      applyTheme(next)
      setTheme(next)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const toggle = () => {
    const next = isDark ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private mode etc.: the theme still switches for this visit.
    }
  }

  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-border bg-surface text-amber-500 transition-colors hover:border-primary/40 dark:text-indigo-200"
    >
      <motion.svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        aria-hidden="true"
        animate={{ rotate: isDark ? 40 : 90 }}
        transition={spring}
      >
        <mask id={maskId}>
          <rect x="0" y="0" width="24" height="24" fill="white" />
          {/* The bite: parked off-canvas for the sun, slides in for the moon. */}
          <motion.circle
            r="8"
            fill="black"
            initial={false}
            animate={isDark ? { cx: 17, cy: 7 } : { cx: 30, cy: -6 }}
            transition={spring}
          />
        </mask>

        <motion.circle
          cx="12"
          cy="12"
          fill="currentColor"
          mask={`url(#${maskId})`}
          initial={false}
          animate={{ r: isDark ? 9 : 5 }}
          transition={spring}
        />

        <motion.g
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ originX: '12px', originY: '12px' }}
          initial={false}
          animate={isDark ? { opacity: 0, scale: 0.4, rotate: -90 } : { opacity: 1, scale: 1, rotate: 0 }}
          transition={spring}
        >
          <line x1="12" y1="1.5" x2="12" y2="3.5" />
          <line x1="12" y1="20.5" x2="12" y2="22.5" />
          <line x1="1.5" y1="12" x2="3.5" y2="12" />
          <line x1="20.5" y1="12" x2="22.5" y2="12" />
          <line x1="4.6" y1="4.6" x2="6" y2="6" />
          <line x1="18" y1="18" x2="19.4" y2="19.4" />
          <line x1="4.6" y1="19.4" x2="6" y2="18" />
          <line x1="18" y1="6" x2="19.4" y2="4.6" />
        </motion.g>
      </motion.svg>
    </motion.button>
  )
}

export default ThemeToggle
