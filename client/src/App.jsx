import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Signup from './pages/Signup.jsx'

// Focused auth screens don't show the footer.
const PAGES_WITHOUT_FOOTER = ['/login', '/register', '/verify-otp']

const App = () => {
  const { pathname } = useLocation()
  const showFooter = !PAGES_WITHOUT_FOOTER.includes(pathname)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* flex-1 pushes the footer to the bottom on short pages */}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Signup />} />
        </Routes>
      </div>
      {showFooter && <Footer />}
    </div>
  )
}

export default App
