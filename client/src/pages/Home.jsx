import React from 'react'
import { motion } from 'motion/react'
import Hero from '../components/home/Hero'
import FeaturedEvents from '../components/home/FeaturedEvents'
import HowItWorks from '../components/home/HowItWorks'

const Home = () => {
  return (
    <motion.main
      className='max-w-7xl mx-auto px-4'
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Hero />
      <FeaturedEvents />
      <HowItWorks />
    </motion.main>
  )
}

export default Home
