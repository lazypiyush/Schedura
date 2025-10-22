const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // FIXED: Changed from 5137 to 5173
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors({
  origin: "http://localhost:5173" // FIXED: Also updated regular CORS
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.log('MongoDB connection error:', err));

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join-project', (projectId) => {
    socket.join(projectId);
    console.log(`User joined project: ${projectId}`);
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
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('socketio', io);

// TEMPORARY DATABASE RESET ROUTE - DELETE AFTER USE!
app.get('/api/admin/reset', async (req, res) => {
  try {
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

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/comments', require('./routes/comments'));

// Test route
app.get('/', (req, res) => {
  res.send('Project Management API is running!');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
