import React, { useState } from 'react'
import { motion } from 'motion/react'
import api from '../../utils/axios'
import { getApiErrorMessage } from '../../utils/apiError'
import FormField from '../ui/FormField'
import Select from '../ui/Select'
import DateTimePicker from '../ui/DateTimePicker'

const BASE_CATEGORIES = ['Music', 'Technology', 'Business', 'Art']

// <input type="datetime-local"> works in local time without a timezone ("2026-11-13T19:00").
const toLocalInput = (isoDate) => {
  const d = new Date(isoDate)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const emptyValues = {
  title: '',
  description: '',
  date: '',
  location: '',
  category: 'Music',
  totalSeats: '',
  ticketPrice: '0',
  imageUrl: '',
}

const valuesFromEvent = (event) => ({
  title: event.title,
  description: event.description,
  date: toLocalInput(event.date),
  location: event.location,
  category: event.category,
  totalSeats: String(event.totalSeats),
  ticketPrice: String(event.ticketPrice),
  imageUrl: event.imageUrl ?? '',
})

const isHttpUrl = (text) => {
  try {
    return ['http:', 'https:'].includes(new URL(text).protocol)
  } catch {
    return false
  }
}

// Seats already taken (confirmed bookings). totalSeats can't go below this.
const seatsTaken = (event) => (event ? event.totalSeats - event.availableSeats : 0)

const validate = (values, editing) => {
  const errors = {}
  if (!values.title.trim()) errors.title = 'Enter a title.'
  if (!values.description.trim()) errors.description = 'Add a short description.'
  if (!values.date) errors.date = 'Pick a date and time.'
  if (!values.location.trim()) errors.location = 'Enter a location.'

  const seats = Number(values.totalSeats)
  if (!Number.isInteger(seats) || seats < 1) errors.totalSeats = 'Enter a whole number, at least 1.'
  else if (editing && seats < seatsTaken(editing)) {
    errors.totalSeats = `${seatsTaken(editing)} seats are already booked, so it can't be lower than that.`
  }

  const price = Number(values.ticketPrice)
  if (values.ticketPrice === '' || Number.isNaN(price) || price < 0) errors.ticketPrice = 'Enter 0 or more.'

  // The backend requires an image URL.
  if (!isHttpUrl(values.imageUrl.trim())) errors.imageUrl = 'Enter a full image link starting with https://'
  return errors
}

// Create a new event, or edit `editing` when it's set.
const EventForm = ({ editing, categories, onSaved, onCancelEdit }) => {
  const [values, setValues] = useState(editing ? valuesFromEvent(editing) : emptyValues)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // "YYYY-MM-DD" for today, read once (keeps render pure).
  const [todayKey] = useState(() => toLocalInput(new Date()).slice(0, 10))

  const categoryOptions = [...new Set([...BASE_CATEGORIES, ...categories, values.category])]
    .filter(Boolean)
    .map((c) => ({ value: c, label: c }))

  const set = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }
  const handleChange = (e) => set(e.target.name, e.target.value)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    const fieldErrors = validate(values, editing)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    const totalSeats = Number(values.totalSeats)
    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      date: new Date(values.date).toISOString(),
      location: values.location.trim(),
      category: values.category,
      totalSeats,
      ticketPrice: Number(values.ticketPrice),
      imageUrl: values.imageUrl.trim(),
    }
    // When editing, keep booked seats booked: available = new total - already taken.
    if (editing) payload.availableSeats = totalSeats - seatsTaken(editing)

    setSubmitting(true)
    try {
      const { data } = editing
        ? await api.put(`/events/${editing._id}`, payload)
        : await api.post('/events', payload)
      onSaved(data, Boolean(editing))
      if (!editing) setValues(emptyValues)
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Could not save this event. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section
      aria-labelledby="event-form-heading"
      className={`flex flex-col gap-5 rounded-3xl border bg-surface p-6 lg:sticky lg:top-6 ${editing ? 'border-primary/40 ring-4 ring-primary-soft' : 'border-border'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="event-form-heading" className="text-xl font-semibold text-main">
          {editing ? 'Edit event' : 'New event'}
        </h2>
        {editing && (
          <button type="button" onClick={onCancelEdit} className="text-sm font-semibold text-muted hover:text-main">
            Cancel edit
          </button>
        )}
      </div>

      {formError && (
        <div role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-on-danger-soft">{formError}</div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField id="ev-title" name="title" label="Title" value={values.title} onChange={handleChange} error={errors.title} />
        <FormField id="ev-description" name="description" label="Description" multiline rows={3} value={values.description} onChange={handleChange} error={errors.description} />

        {/* Full width: the chosen date reads like "Wednesday, 11 November 2026 · 7:00 pm" */}
        <div className="flex flex-col gap-1.5">
          <span id="ev-date-label" className="text-sm font-semibold text-main">Date & time</span>
          <DateTimePicker
            value={values.date}
            onChange={(value) => set('date', value)}
            labelledBy="ev-date-label"
            error={errors.date}
            // New events can't start in the past; existing (maybe past) events stay editable.
            minDate={editing ? undefined : todayKey}
          />
          {errors.date && <p className="text-sm font-medium text-danger">{errors.date}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span id="ev-category-label" className="text-sm font-semibold text-main">Category</span>
            <Select
              value={values.category}
              onChange={(value) => set('category', value)}
              options={categoryOptions}
              labelledBy="ev-category-label"
              size="md"
              className="border-input-border hover:border-primary/40"
            />
          </div>
          <FormField id="ev-location" name="location" label="Location" value={values.location} onChange={handleChange} error={errors.location} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            id="ev-seats" name="totalSeats" type="number" min="1" inputMode="numeric" label="Total seats"
            value={values.totalSeats} onChange={handleChange} error={errors.totalSeats}
            hint={editing && seatsTaken(editing) > 0 ? `${seatsTaken(editing)} already booked` : undefined}
          />
          <FormField
            id="ev-price" name="ticketPrice" type="number" min="0" inputMode="decimal" label="Ticket price"
            value={values.ticketPrice} onChange={handleChange} error={errors.ticketPrice} hint="0 = free"
          />
        </div>

        <FormField id="ev-image" name="imageUrl" type="url" label="Image URL" placeholder="https://…" value={values.imageUrl} onChange={handleChange} error={errors.imageUrl} />
        {isHttpUrl(values.imageUrl.trim()) && (
          <img src={values.imageUrl.trim()} alt="" className="h-32 w-full rounded-2xl border border-border object-cover" />
        )}

        <motion.button
          type="submit"
          disabled={submitting}
          className="mt-1 h-12 rounded-full bg-primary font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-70"
          whileHover={submitting ? undefined : { scale: 1.02 }}
          whileTap={submitting ? undefined : { scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create event'}
        </motion.button>
      </form>
    </section>
  )
}

export default EventForm
