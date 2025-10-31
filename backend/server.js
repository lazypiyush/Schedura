const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const axios = require('axios');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ✅ PRODUCTION-READY CORS - Multiple origins support
const allowedOrigins = [
  'http://localhost:5173',              // Local dev
  'https://schedura.vercel.app',        // Production
  'https://schedura-workspace.vercel.app', // NEW: Current production URL
  'https://schedura-git-main-lazypiyush.vercel.app', // Vercel preview
  process.env.FRONTEND_URL              // Env variable
].filter(Boolean);

// Socket.IO with dynamic CORS
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
  },
  transports: ['websocket', 'polling'], // Fallback for better compatibility
  pingTimeout: 60000,
  pingInterval: 25000
});

// Express CORS middleware - ✅ FIXED
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization',
    'x-auth-token'  // ✅ ADDED - Custom auth header
  ]
}));

app.use(express.json());

// MongoDB Connection with better error handling
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('🗄️  Database:', mongoose.connection.name);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1); // Exit if DB connection fails
});

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('👤 New client connected:', socket.id);
  
  socket.on('join-project', (projectId) => {
    socket.join(projectId);
    console.log(`📋 User ${socket.id} joined project: ${projectId}`);
  });
  
  socket.on('task-update', (data) => {
    io.to(data.projectId).emit('task-updated', data);
  });
  
  socket.on('new-comment', (data) => {
    io.to(data.projectId).emit('comment-added', data);
  });
  
  // Notification event
  socket.on('send-notification', (data) => {
    io.to(data.projectId).emit('notification', data);
  });
  
  socket.on('disconnect', () => {
    console.log('👋 Client disconnected:', socket.id);
  });
  
  // Error handling
  socket.on('error', (error) => {
    console.error('🔥 Socket error:', error);
  });
});

// Make io accessible to routes
app.set('socketio', io);

// ⏰ Self-Ping Cron Job - Keep server awake on Render
if (process.env.NODE_ENV === 'production') {
  const BACKEND_URL = process.env.BACKEND_URL || 'https://schedura-backend.onrender.com';
  
  // Ping every 14 minutes (before Render's 15-min sleep)
  cron.schedule('*/14 * * * *', async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/health`);
      console.log(`✅ Self-ping successful - Server kept alive at ${new Date().toISOString()}`);
      console.log(`   Status: ${response.data.status}`);
    } catch (error) {
      console.error('❌ Self-ping failed:', error.message);
    }
  });
  
  console.log('⏰ Self-ping cron job started (runs every 14 minutes)');
  console.log(`   Target URL: ${BACKEND_URL}/health`);
}

// Health check endpoint (for deployment monitoring)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Schedura API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Schedura Project Management API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      projects: '/api/projects',
      tasks: '/api/tasks',
      comments: '/api/comments'
    }
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/comments', require('./routes/comments'));

// TEMPORARY DATABASE RESET ROUTE - DELETE AFTER USE!
// ⚠️ SECURITY: Add authentication or remove in production
app.get('/api/admin/reset', async (req, res) => {
  try {
    // Check if in production - prevent accidental data loss
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        error: 'Database reset is disabled in production',
        message: 'Please use MongoDB Atlas UI to manage data'
      });
    }

    const Task = require('./models/Task');
    const Project = require('./models/Project');
    const User = require('./models/User');
    const Comment = require('./models/Comment');
    
    await Task.deleteMany({});
    await Project.deleteMany({});
    await User.deleteMany({});
    await Comment.deleteMany({});
    
    console.log('✅ Database cleared successfully!');
    
    res.json({ 
      success: true, 
      msg: 'All data cleared! Please logout, clear localStorage, and create fresh accounts.',
      cleared: {
        tasks: true,
        projects: true,
        users: true,
        comments: true
      }
    });
  } catch (err) {
    console.error('❌ Error clearing database:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, closing server gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('========================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log('========================================');
});
