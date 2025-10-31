import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'
import { SocketProvider } from './context/SocketContext'
import './index.css'
import App from './App.jsx'

// ✅ Capacitor Imports
import { App as CapacitorApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

// ✅ Capacitor Setup
StatusBar.setStyle({ style: Style.Dark })
StatusBar.setBackgroundColor({ color: '#141824' })

CapacitorApp.addListener('appStateChange', ({ isActive }) => {
  console.log('App state changed, isActive:', isActive)
})

SplashScreen.hide().catch(() => {})

// ✅ Clerk Configuration for Capacitor
const clerkConfig = {
  publishableKey: PUBLISHABLE_KEY,
  afterSignInUrl: '/dashboard',
  afterSignUpUrl: '/dashboard',
  signInUrl: '/login',
  signUpUrl: '/sign-up',
  // ✅ CRITICAL: Allow Capacitor redirect URLs
  allowedRedirectOrigins: [
    'capacitor://localhost',
    'ionic://localhost',
    'capacitor://*',
    'ionic://*'
  ],
  // ✅ Force redirect to stay in app (don't open browser)
  frontendApi: PUBLISHABLE_KEY,
  appearance: {
    variables: {
      colorPrimary: '#2196F3',
      colorBackground: '#141824'
    }
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider {...clerkConfig}>
      <BrowserRouter>
        <SocketProvider>
          <App />
        </SocketProvider>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>
)
