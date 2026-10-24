import React from 'react'
import { motion } from 'motion/react'

const steps = [
  {
    title: 'Pick an event',
    text: 'Browse by category and open any event to see the details and seats left.',
    badge: 'bg-primary-soft text-on-primary-soft',
  },
  {
    title: 'Confirm with a code',
    text: 'We email you a 6-digit code. Enter it to send your booking request.',
    badge: 'bg-primary-soft text-on-primary-soft',
  },
  {
    title: 'Get confirmed',
    text: 'Once the organiser confirms, your seat is held and you get an email.',
    badge: 'bg-accent-soft text-on-accent-soft',
  },
]

const HowItWorks = () => {
  return (
    <section aria-labelledby="how-heading" className="pb-20">
      <h2 id="how-heading" className="mb-6 text-2xl md:text-3xl font-bold text-main">How booking works</h2>

      <ol className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {steps.map((step, index) => (
          <motion.li
            key={step.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.08 }}
            // Hover has its own transition so it doesn't inherit the entrance delay.
            whileHover={{ y: -6, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
            className="group flex flex-col gap-3 rounded-3xl border border-border bg-surface p-6 transition-[border-color,box-shadow] duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
          >
            <span
              aria-hidden="true"
              className={`flex h-10 w-10 items-center justify-center rounded-full font-bold transition-transform duration-300 group-hover:scale-110 ${step.badge}`}
            >
              {index + 1}
            </span>
            <h3 className="text-lg font-semibold text-main">{step.title}</h3>
            <p className="leading-relaxed text-muted">{step.text}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  )
}

export default HowItWorks
