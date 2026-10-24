import React, { useContext } from 'react'
import { motion } from 'motion/react'
import MotionLink from '../MotionLink'
import { AuthContext } from '../../context/AuthContext.jsx'

// The secondary button depends on who's looking: guests are invited to sign up,
// logged-in people get a shortcut to where they'll want to go next.
const secondaryAction = (user) => {
  if (!user) return { to: '/register', label: 'Create an account' }
  if (user.role === 'admin') return { to: '/admin/events', label: 'Manage events' }
  return { to: '/bookings/my', label: 'My bookings' }
}

const Hero = () => {
  const { user } = useContext(AuthContext)
  const secondary = secondaryAction(user)

  return (
    <section className='grid grid-cols-1 items-center gap-10 md:grid-cols-2 py-10 md:py-16'>
      {/* Left Section */}
      <div className='w-full '>
        <span className='inline-block bg-primary-soft text-on-primary-soft text-sm font-semibold rounded-full px-3 py-1.5'>
          Concerts · tech meetups · art · business
        </span>
        <h1 className='mt-6 mb-6 text-4xl md:text-6xl font-bold leading-tight tracking-tight text-main'>
          Find your next <br className='hidden md:inline' />favourite event<span className='text-primary'>.</span>
        </h1>
        <p className='mb-8 max-w-md text-lg md:text-xl text-muted'>
          Browse what's happening, reserve your seat with a quick email code, and keep every booking in one place.
        </p>
        <div className='flex gap-5 flex-wrap'>
          <MotionLink
            to="/events"
            className="flex items-center bg-primary text-on-primary rounded-full px-5 py-3 font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            Browse events
          </MotionLink>

          <MotionLink
            to={secondary.to}
            className="flex items-center bg-surface text-main rounded-full px-6 py-3 font-semibold border-2 border-border"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {secondary.label}
          </MotionLink>
        </div>
      </div>

      {/* Right Section */}
      <div className='h-64 w-full overflow-hidden rounded-[28px] md:h-[450px]'>
        <motion.img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
          alt=""
          className='w-full h-full object-cover'
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </section>
  )
}

export default Hero
