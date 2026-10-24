import React, { useContext, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { AuthContext } from '../context/AuthContext.jsx'
import MotionLink from './MotionLink'
import { buttonSpring } from '../utils/motion'

const navLinkClass = ({ isActive }) => {
  return `relative isolate px-4 py-2 rounded-full font-semibold transition-colors ${isActive ? 'text-on-primary-soft' : 'text-muted hover:text-main'}`
}

// A nav link whose active pill slides to whichever link is active.
// Desktop and mobile lists use different pillIds so their pills don't fight.
const NavItem = ({ to, pillId, onClick, children }) => (
  <NavLink to={to} className={navLinkClass} onClick={onClick}>
    {({ isActive }) => (
      <>
        {isActive && (
          <motion.span
            layoutId={pillId}
            aria-hidden="true"
            className="absolute inset-0 -z-10 rounded-full bg-primary-soft"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        {children}
      </>
    )}
  </NavLink>
)

const getLinks = (user, isAdmin) => {
  if (isAdmin) {
    return [
      { to: '/events', label: 'Events' },
      { to: '/admin/bookings', label: 'Bookings' },
      { to: '/admin/events', label: 'Manage events' },
    ]
  }
  if (user) {
    return [
      { to: '/events', label: 'Events' },
      { to: '/bookings/my', label: 'My bookings' },
    ]
  }
  return [{ to: '/events', label: 'Events' }]
}

const AccountActions = ({ user, isAdmin, onLogout, onNavigate }) => {
  if (!user) {
    return (
      <>
        <Link to="/login" onClick={onNavigate} className="px-4 py-2 font-semibold text-main">Log in</Link>
        <MotionLink
          to="/register"
          onClick={onNavigate}
          className="bg-primary text-on-primary rounded-full px-5 py-3 font-semibold"
          {...buttonSpring}
        >
          Sign up
        </MotionLink>
      </>
    )
  }

  return (
    <>
      {isAdmin ? (
        <span className="rounded-full bg-main px-4 py-2 text-xs font-semibold tracking-wide text-background">
          ADMIN
        </span>
      ) : (
        <div className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft font-bold text-on-accent-soft"
          >
            {user.username?.charAt(0).toUpperCase()}
          </span>
          <span className="font-medium text-main">{user.username}</span>
        </div>
      )}
      <motion.button
        type="button"
        onClick={onLogout}
        className="h-11 rounded-full border border-border px-4 font-semibold text-main transition-colors hover:bg-primary hover:text-on-primary"
        {...buttonSpring}
      >
        Log out
      </motion.button>
    </>
  )
}

const Navbar = () => {
  const { user, logout } = useContext(AuthContext)
  const [menuOpen, setMenuOpen] = useState(false)
  const isAdmin = user?.role === 'admin'
  const links = getLinks(user, isAdmin)

  const closeMenu = () => setMenuOpen(false)
  const handleLogout = () => {
    logout()
    closeMenu()
  }

  return (
    <header>
      <nav className="relative bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between gap-3">
          <Link to="/" onClick={closeMenu} className="text-2xl font-bold text-main">
            evora<span className="text-primary">.</span>
          </Link>

          {/* Desktop: full row of links */}
          <div className="hidden md:flex items-center gap-2">
            {links.map((link) => (
              <NavItem key={link.to} to={link.to} pillId="nav-pill-desktop">{link.label}</NavItem>
            ))}
            <div className="ml-2 flex items-center gap-2">
              <AccountActions user={user} isAdmin={isAdmin} onLogout={logout} />
            </div>
          </div>

          {/* Mobile: menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="md:hidden flex h-11 w-11 items-center justify-center rounded-full border border-border text-main"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile: dropdown panel */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="md:hidden absolute inset-x-0 top-full z-50 border-b border-border bg-surface px-4 pb-4 shadow-lg"
            >
              <div className="flex flex-col gap-1 pt-2">
                {links.map((link) => (
                  <NavItem key={link.to} to={link.to} pillId="nav-pill-mobile" onClick={closeMenu}>{link.label}</NavItem>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <AccountActions user={user} isAdmin={isAdmin} onLogout={handleLogout} onNavigate={closeMenu} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}

export default Navbar
