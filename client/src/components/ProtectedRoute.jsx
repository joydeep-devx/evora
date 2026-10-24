import React, { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'

// Sends guests to /login (remembering where they were going) and
// non-matching roles back home. The backend still enforces the real rules.
const ProtectedRoute = ({ role, children }) => {
  const { user } = useContext(AuthContext)
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

export default ProtectedRoute
