import { SignIn } from '@clerk/clerk-react'
import './Login.css'

const Login = () => {
  return (
    <div className="login-container">
      <div className="login-background">
        <div className="gradient-circle gradient-1"></div>
        <div className="gradient-circle gradient-2"></div>
      </div>
      
      <div className="login-content">
        <div className="login-header">
          <h1>Welcome Back!</h1>
          <p>Organize your projects with ease</p>
        </div>

        <SignIn 
          routing="path" 
          path="/login"
          signUpUrl="/sign-up"
          // ✅ Capacitor fixes - stay in app
          fallbackRedirectUrl="/dashboard"
          redirectUrl="/dashboard"
          appearance={{
            baseTheme: 'light',
            variables: {
              colorPrimary: '#2196F3',
              colorBackground: '#ffffff',
              colorInputBackground: '#F5F5F5',
              colorInputText: '#1a1a1a',
              colorText: '#1a1a1a',
              colorTextSecondary: '#6B7280',
              fontFamily: 'Inter, system-ui, sans-serif',
              borderRadius: '12px'
            },
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-2xl bg-white border-0',
              headerTitle: 'text-gray-900',
              headerSubtitle: 'text-gray-600',
              socialButtonsBlockButton: 'border-2 border-gray-200 hover:border-blue-500 bg-white hover:bg-gray-50 transition-all',
              formButtonPrimary: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white',
              footerActionLink: 'text-blue-500 hover:text-blue-600',
              formFieldInput: 'border-gray-300 focus:border-blue-500 bg-gray-50',
              formFieldLabel: 'text-gray-700'
            }
          }}
        />
      </div>
    </div>
  )
}

export default Login
