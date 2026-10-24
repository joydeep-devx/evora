import React from 'react'
import { Route, Routes, matchPath, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Signup from './pages/Signup.jsx'
import VerifyOtp from './pages/VerifyOtp.jsx'
import Events from './pages/Events.jsx'
import EventDetails from './pages/EventDetails.jsx'
import MyBookings from './pages/MyBookings.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

// Focused screens (auth forms, event details, my bookings) don't show the footer.
const PAGES_WITHOUT_FOOTER = ['/login', '/register', '/verify-otp', '/events/:id', '/bookings/my']

const App = () => {
  const { pathname } = useLocation()
  const showFooter = !PAGES_WITHOUT_FOOTER.some((pattern) => matchPath(pattern, pathname))

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* flex-1 pushes the footer to the bottom on short pages */}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/events/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
          {/* Admins see everyone's bookings on their own page, so this one is users only. */}
          <Route path="/bookings/my" element={<ProtectedRoute role="user"><MyBookings /></ProtectedRoute>} />
        </Routes>
      </div>
      {showFooter && <Footer />}
    </div>
  )
}

export default App
