import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/clerk-react'
import Login from './pages/Login'
import SignUpPage from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import ProjectBoard from './pages/ProjectBoard'
import './App.css'

function App() {
  return (
    <Routes>
      {/* Public Routes - CHANGED /login to /sign-in */}
      <Route
        path="/sign-in/*"
        element={
          <>
            <SignedOut>
              <Login />
            </SignedOut>
            <SignedIn>
              <Navigate to="/dashboard" replace />
            </SignedIn>
          </>
        }
      />

      <Route
        path="/sign-up/*"
        element={
          <>
            <SignedOut>
              <SignUpPage />
            </SignedOut>
            <SignedIn>
              <Navigate to="/dashboard" replace />
            </SignedIn>
          </>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <>
            <SignedIn>
              <Dashboard />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      />

      <Route
        path="/project/:id"
        element={
          <>
            <SignedIn>
              <ProjectBoard />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      />

      {/* Default Route */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Redirect old /login to /sign-in */}
      <Route path="/login" element={<Navigate to="/sign-in" replace />} />
    </Routes>
  )
}

export default App
