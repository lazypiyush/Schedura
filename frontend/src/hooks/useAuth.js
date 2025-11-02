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
          
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
          
          const response = await fetch(`${API_URL}/api/auth/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clerkId: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              name: user.fullName || user.firstName || 'User',
              avatar: user.imageUrl // ✅ Send Clerk avatar
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log('✅ Token saved for user:', user.id)
            console.log('✅ Avatar synced:', data.user.avatar)
            localStorage.setItem('token', data.token)
          } else {
            console.error('❌ Auth sync failed:', response.status)
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
  }, [isSignedIn, user?.id, user?.imageUrl]) // ✅ Also watch imageUrl changes

  return { isSignedIn, user }
}
