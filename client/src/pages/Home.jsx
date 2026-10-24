import React from 'react'
import { motion } from 'motion/react'
import Hero from '../components/home/Hero'
import FeaturedEvents from '../components/home/FeaturedEvents'
import HowItWorks from '../components/home/HowItWorks'
import { useEvents, upcomingEvents, pastEvents } from '../hooks/useEvents'

const Home = () => {
  // Fetched once here and shared, so the two event rows make a single API call.
  const eventsState = useEvents()

  return (
    <motion.main
      className='max-w-7xl mx-auto px-4'
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Hero />
      <FeaturedEvents
        eventsState={eventsState}
        select={upcomingEvents}
        headingId="featured-heading"
        title="Happening soon"
        subtitle="Grab a seat before they're gone."
        emptyTitle="No upcoming events yet"
        emptyText="Check back soon — new events are added regularly."
        seeAllLink="/events"
      />
      {/* Only shows once there's something to show; the row above handles login and error messages. */}
      <FeaturedEvents
        eventsState={eventsState}
        select={pastEvents}
        headingId="past-heading"
        title="Recently wrapped up"
        subtitle="A look back at what's already happened on Evora."
        ended
        showStates={false}
        hideWhenEmpty
      />
      <HowItWorks />
    </motion.main>
  )
}

export default Home
