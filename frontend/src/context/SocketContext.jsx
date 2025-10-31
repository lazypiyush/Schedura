import { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../services/api';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      console.log('🔌 Connecting to Socket.IO:', SOCKET_URL);
      
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'], // Fallback for production
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('✅ Socket Connected:', newSocket.id);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket Disconnected:', reason);
      });

      newSocket.on('connect_error', (error) => {
        console.error('🔥 Socket Connection Error:', error.message);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket Reconnected after', attemptNumber, 'attempts');
      });

      newSocket.on('reconnect_failed', () => {
        console.error('💥 Socket Reconnection Failed');
      });

      return () => {
        console.log('🔌 Closing socket connection');
        newSocket.close();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
