import { useContext, useEffect, useState } from 'react'
import api from '../utils/axios'
import { AuthContext } from '../context/AuthContext.jsx'

// Loads all events. status: 'loading' | 'success' | 'login' | 'error'
// ('login' = the API refused us with a 401: logged out, or the token expired).
export const useEvents = () => {
  const { user } = useContext(AuthContext)
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('loading')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let ignore = false

    api.get('/events')
      .then(({ data }) => {
        if (ignore) return
        setEvents(data)
        setStatus('success')
      })
      .catch((error) => {
        if (ignore) return
        setStatus(error.response?.status === 401 ? 'login' : 'error')
      })

    return () => {
      ignore = true
    }
  }, [user, reloadKey])

  const retry = () => {
    setStatus('loading')
    setReloadKey((key) => key + 1)
  }

  return { events, status, retry }
}

// Upcoming events only, soonest first.
export const upcomingEvents = (events) =>
  events
    .filter((event) => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))

// Events that have already happened, most recent first.
export const pastEvents = (events) =>
  events
    .filter((event) => new Date(event.date) < new Date())
    .sort((a, b) => new Date(b.date) - new Date(a.date))
