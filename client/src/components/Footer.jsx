import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'
import MotionLink from './MotionLink'

// Read once when the module loads; keeps render pure.
const currentYear = new Date().getFullYear()

const categories = ['Music', 'Technology', 'Business', 'Art']

const linkClass = 'text-muted transition-colors hover:text-primary'

const FooterColumn = ({ title, children }) => (
  <div>
    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-main">{title}</h2>
    <ul className="flex flex-col gap-3 text-sm">{children}</ul>
  </div>
)

const Footer = () => {
  const { user } = useContext(AuthContext)
  const isAdmin = user?.role === 'admin'

  return (
    <footer className="border-t border-border bg-surface">
      <div className="max-w-7xl mx-auto grid grid-cols-2 gap-10 px-4 py-12 md:grid-cols-4">
        {/* Brand */}
        <div className="col-span-2 flex flex-col items-start gap-4 md:col-span-1">
          <Link to="/" className="text-2xl font-bold text-main">
            evora<span className="text-primary">.</span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Find concerts, meetups, workshops and more. Reserve your seat with a quick email code and keep every booking in one place.
          </p>
        </div>

        <FooterColumn title="Explore">
          <li><Link to="/events" className={linkClass}>All events</Link></li>
          <li><Link to="/" className={linkClass}>Home</Link></li>
        </FooterColumn>

        <FooterColumn title="Categories">
          {categories.map((category) => (
            <li key={category}>
              <Link to={`/events?category=${category}`} className={linkClass}>{category}</Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Account">
          {!user && (
            <>
              <li><Link to="/login" className={linkClass}>Log in</Link></li>
              <li><Link to="/register" className={linkClass}>Sign up</Link></li>
            </>
          )}
          {user && !isAdmin && (
            <li><Link to="/bookings/my" className={linkClass}>My bookings</Link></li>
          )}
          {isAdmin && (
            <>
              <li><Link to="/admin/bookings" className={linkClass}>Manage bookings</Link></li>
              <li><Link to="/admin/events" className={linkClass}>Manage events</Link></li>
            </>
          )}
        </FooterColumn>
      </div>

      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm text-muted">
          <p>© {currentYear} Evora. All rights reserved.</p>
          <p>Book your event<span className="text-primary">.</span></p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
