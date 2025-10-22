import { useUser } from '@clerk/clerk-react'
import { useEffect } from 'react'

export const useAuth = () => {
  const { isSignedIn, user } = useUser()

  useEffect(() => {
    const syncUser = async () => {
      if (isSignedIn && user) {
        try {
          console.log('🔄 Syncing user:', user.id)
          console.log('🖼️ Avatar URL:', user.imageUrl)
          
          const response = await fetch('http://localhost:5000/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clerkId: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              name: user.fullName || user.firstName || 'User',
              avatar: user.imageUrl // ADD THIS LINE
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log('✅ New token saved for user:', user.id)
            localStorage.setItem('token', data.token)
          }
        } catch (error) {
          console.error('❌ Auth sync error:', error)
        }
      } else {
        console.log('🚪 User logged out, clearing token')
        localStorage.removeItem('token')
      }
    }

    syncUser()
  }, [isSignedIn, user?.id])

  return { isSignedIn, user }
}
