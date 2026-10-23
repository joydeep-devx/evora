import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'

const MotionLink = motion.create(Link)

const navLinkClass = ({ isActive }) => {
  return `relative isolate px-4 py-2 rounded-full font-semibold transition-colors ${isActive ? 'text-on-primary-soft' : 'text-muted hover:text-main'}`
}

// A nav link whose active pill slides to whichever link is active.
const NavItem = ({ to, children }) => (
  <NavLink to={to} className={navLinkClass}>
    {({ isActive }) => (
      <>
        {isActive && (
          <motion.span
            layoutId="nav-active-pill"
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

const Navbar = () => {
  const { user, logout } = useContext(AuthContext)
  const isAdmin = user?.role === 'admin'

  return (
    <header>
      <nav className="bg-surface border-b border-border">
        <div className="max-w-5xl flex flex-wrap items-center justify-between gap-3 mx-auto p-4 ">
          <div>
            <Link to="/" className='text-2xl font-bold text-main'>evora<span className='text-primary'>.</span></Link>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <NavItem to="/events">Events</NavItem>

            {user && !isAdmin && (
              <NavItem to="/bookings/my">My bookings</NavItem>
            )}

            {isAdmin && (
              <>
                <NavItem to="/admin/bookings">Bookings</NavItem>
                <NavItem to="/admin/events">Manage events</NavItem>
              </>
            )}

            {user ? (
              <>
                {isAdmin ? (
                  <span className="ml-2 rounded-full bg-main px-4 py-2 text-xs font-semibold tracking-wide text-background">
                    ADMIN
                  </span>
                ) : (
                  <div className="ml-2 flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3">
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
                  onClick={logout}
                  className="h-11 rounded-full border border-border px-4 font-semibold text-main transition-colors hover:bg-primary hover:text-on-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  Log out
                </motion.button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 font-semibold text-main">Log in</Link>
                <MotionLink
                  to="/register"
                  className="bg-primary text-on-primary rounded-full px-5 py-3 font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  Sign up
                </MotionLink>
              </>
            )}

          </div>
        </div>

      </nav>
    </header>
  )
}

export default Navbar