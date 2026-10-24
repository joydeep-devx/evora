import React from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import MotionLink from '../components/MotionLink'
import { buttonSpring } from '../utils/motion'

// Each child of the stack springs up in turn.
const stack = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const rise = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
}

// Floating confetti behind the content (decorative). A party mix on purpose,
// so it uses Tailwind's palette alongside the brand coral and teal.
// shape: dot = circle, square = small tile, strip = paper ribbon (squares and strips spin).
const CONFETTI = [
  { left: '8%', top: '18%', size: 14, color: 'bg-primary', shape: 'dot', delay: 0 },
  { left: '18%', top: '72%', size: 10, color: 'bg-on-accent-soft', shape: 'dot', delay: 0.6 },
  { left: '82%', top: '22%', size: 12, color: 'bg-amber-400', shape: 'square', delay: 1.1 },
  { left: '90%', top: '64%', size: 16, color: 'bg-primary-soft', shape: 'dot', delay: 0.3 },
  { left: '72%', top: '84%', size: 9, color: 'bg-violet-400', shape: 'dot', delay: 0.9 },
  { left: '30%', top: '10%', size: 8, color: 'bg-sky-400', shape: 'dot', delay: 1.4 },
  { left: '4%', top: '45%', size: 12, color: 'bg-sky-400', shape: 'strip', delay: 0.2 },
  { left: '14%', top: '88%', size: 10, color: 'bg-amber-400', shape: 'dot', delay: 1.2 },
  { left: '24%', top: '34%', size: 9, color: 'bg-violet-400', shape: 'square', delay: 0.7 },
  { left: '40%', top: '86%', size: 12, color: 'bg-emerald-400', shape: 'strip', delay: 1.6 },
  { left: '55%', top: '8%', size: 10, color: 'bg-pink-400', shape: 'square', delay: 0.4 },
  { left: '62%', top: '92%', size: 8, color: 'bg-primary', shape: 'dot', delay: 1.8 },
  { left: '76%', top: '44%', size: 12, color: 'bg-pink-400', shape: 'strip', delay: 0.8 },
  { left: '86%', top: '8%', size: 9, color: 'bg-emerald-400', shape: 'dot', delay: 1.3 },
  { left: '94%', top: '36%', size: 11, color: 'bg-violet-400', shape: 'strip', delay: 0.5 },
  { left: '50%', top: '96%', size: 10, color: 'bg-on-accent-soft', shape: 'square', delay: 2 },
  { left: '96%', top: '86%', size: 8, color: 'bg-amber-400', shape: 'square', delay: 1.5 },
  { left: '36%', top: '20%', size: 7, color: 'bg-emerald-400', shape: 'dot', delay: 1 },
]

const shapeStyle = ({ shape, size }) => {
  if (shape === 'strip') return { width: size * 0.45, height: size * 1.8, borderRadius: 2 }
  if (shape === 'square') return { width: size, height: size, borderRadius: 3 }
  return { width: size, height: size, borderRadius: '9999px' }
}

// A torn event ticket standing in for the "0". You can drag it; it springs back.
const Ticket = () => (
  <motion.div
    variants={rise}
    className="relative mx-1 sm:mx-3"
    aria-hidden="true"
  >
    <motion.div
      drag
      dragSnapToOrigin
      dragElastic={0.4}
      whileDrag={{ scale: 1.08, rotate: -4, cursor: 'grabbing' }}
      animate={{ y: [0, -10, 0], rotate: [-8, -3, -8] }}
      transition={{ duration: 3.6, ease: 'easeInOut', repeat: Infinity }}
      className="cursor-grab touch-none"
    >
      <svg viewBox="0 0 120 170" className="h-28 w-20 drop-shadow-xl sm:h-44 sm:w-32">
        {/* Ticket body with side notches */}
        <path
          d="M14 4h92a10 10 0 0 1 10 10v50a12 12 0 0 0 0 24v68a10 10 0 0 1-10 10H14a10 10 0 0 1-10-10V88a12 12 0 0 0 0-24V14A10 10 0 0 1 14 4z"
          className="fill-primary"
        />
        {/* Perforation */}
        <line x1="22" y1="76" x2="98" y2="76" stroke="white" strokeOpacity="0.6" strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round" />
        {/* Torn-off stub edge */}
        <path d="M4 150 l12 -8 12 8 12 -8 12 8 12 -8 12 8 12 -8 12 8 12 -8 12 8" fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="3" />
        <text x="60" y="44" textAnchor="middle" className="fill-white" style={{ font: '700 26px Poppins, sans-serif' }}>?</text>
        <text x="60" y="118" textAnchor="middle" className="fill-white" style={{ font: '600 11px Poppins, sans-serif', letterSpacing: '0.18em' }}>NO EVENT</text>
      </svg>
    </motion.div>
  </motion.div>
)

const NotFound = () => {
  const { pathname } = useLocation()

  return (
    <main className="relative isolate flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden px-4 py-16">
      {CONFETTI.map((piece, i) => {
        const spins = piece.shape !== 'dot'
        // Alternate spin direction so the pieces don't all turn the same way.
        const turn = i % 2 === 0 ? 360 : -360
        return (
          <motion.span
            key={i}
            aria-hidden="true"
            className={`absolute -z-10 ${piece.color}`}
            style={{ left: piece.left, top: piece.top, ...shapeStyle(piece) }}
            initial={{ opacity: 0, scale: 0, rotate: spins ? 20 : 0 }}
            animate={{
              opacity: [0, 0.85, 0.85],
              scale: 1,
              y: [0, -18, 0],
              rotate: spins ? [20, 20 + turn] : 0,
            }}
            transition={{
              opacity: { duration: 0.6, delay: piece.delay },
              scale: { type: 'spring', stiffness: 200, damping: 12, delay: piece.delay },
              y: { duration: 4 + (i % 6) * 0.5, ease: 'easeInOut', repeat: Infinity, delay: piece.delay },
              rotate: { duration: 6 + (i % 4) * 2, ease: 'linear', repeat: Infinity, delay: piece.delay },
            }}
          />
        )
      })}

      <motion.div variants={stack} initial="hidden" animate="show" className="flex max-w-xl flex-col items-center text-center">
        <motion.div variants={stack} className="flex items-center" role="img" aria-label="404">
          <motion.span variants={rise} className="text-[7rem] font-bold leading-none tracking-tight text-main sm:text-[11rem]" aria-hidden="true">4</motion.span>
          <Ticket />
          <motion.span variants={rise} className="text-[7rem] font-bold leading-none tracking-tight text-main sm:text-[11rem]" aria-hidden="true">4</motion.span>
        </motion.div>

        <motion.h1 variants={rise} className="mt-6 text-3xl font-bold text-main sm:text-4xl">
          This page wandered off<span className="text-primary">.</span>
        </motion.h1>

        <motion.p variants={rise} className="mt-3 text-lg text-muted">
          We couldn't find <code className="rounded-lg bg-border/60 px-2 py-0.5 text-base text-main">{pathname}</code>. It may have moved, or the link is wrong.
        </motion.p>

        <motion.div variants={rise} className="mt-8 flex flex-wrap justify-center gap-3">
          <MotionLink to="/" className="rounded-full bg-primary px-6 py-3 font-semibold text-on-primary" {...buttonSpring}>
            Go home
          </MotionLink>
          <MotionLink to="/events" className="rounded-full border-2 border-border bg-surface px-6 py-3 font-semibold text-main" {...buttonSpring}>
            Browse events
          </MotionLink>
        </motion.div>

        <motion.p variants={rise} className="mt-6 hidden text-xs text-muted/70 sm:block" aria-hidden="true">
          Psst — you can drag the ticket.
        </motion.p>
      </motion.div>
    </main>
  )
}

export default NotFound
