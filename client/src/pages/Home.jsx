import React from 'react'
import { motion } from 'motion/react'
import Hero from '../components/home/Hero'
import EventCard from '../components/EventCard'

// Temporary preview data shaped like GET /api/events — replaced when the
// "Happening soon" section fetches real events.
const previewEvent = {
  _id: 'preview',
  title: 'Neon Nights EDM Festival',
  category: 'Music',
  date: '2026-11-13T19:00:00.000Z',
  location: 'Grand Arena, New York',
  ticketPrice: 1500,
  availableSeats: 500,
  imageUrl: '',
}

const Home = () => {
  return (
    <motion.main
      className='max-w-7xl mx-auto px-4'
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Hero />
      <div className='grid grid-cols-1 gap-6 pb-16 sm:grid-cols-2 lg:grid-cols-3'>
        <EventCard event={previewEvent} />
      </div>
    </motion.main>
  )
}

export default Home
