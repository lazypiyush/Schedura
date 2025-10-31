import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'
import { SocketProvider } from './context/SocketContext'
import './index.css'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: '#2196F3',
          colorBackground: '#0D1B2A',
          colorInputBackground: '#1B263B',
          colorInputText: '#ffffff',
          colorText: '#ffffff',
          colorTextSecondary: '#9CA3AF',
          fontFamily: 'Inter, system-ui, sans-serif',
          borderRadius: '12px'
        },
        elements: {
          card: 'shadow-2xl',
          headerTitle: 'text-2xl font-bold',
          headerSubtitle: 'text-gray-400',
          socialButtonsBlockButton: 'border-2 border-gray-700 hover:border-blue-500 transition-all',
          formButtonPrimary: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
          footerActionLink: 'text-blue-400 hover:text-blue-300'
        }
      }}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <BrowserRouter>
        <SocketProvider>
          <App />
        </SocketProvider>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
