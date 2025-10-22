import { createContext, useContext, useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import io from 'socket.io-client'

const SocketContext = createContext()

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const { user } = useUser()

  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5000')
      setSocket(newSocket)

      newSocket.on('connect', () => {
        console.log('✅ Connected to server:', newSocket.id)
      })

      newSocket.on('disconnect', () => {
        console.log('❌ Disconnected from server')
      })

      return () => newSocket.close()
    }
  }, [user])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}
