# 📊 Project Management Tool

A collaborative project management application similar to Trello/Asana with real-time updates.

## ✨ Features

- 🔐 **Authentication** - Clerk OAuth (Google/Microsoft)
- 📋 **Project Boards** - Kanban-style task management
- 🎯 **Task Management** - Create, assign, and track tasks
- 💬 **Real-time Comments** - Live collaboration via WebSocket
- 👥 **Team Collaboration** - Add members to projects
- 🎨 **Beautiful UI** - Modern design with dark/light themes
- ⌨️ **Keyboard Navigation** - Arrow keys to move tasks
- 🔄 **Drag & Drop** - Intuitive task movement

## 🛠️ Tech Stack

**Frontend:**
- React + Vite
- Clerk Authentication
- Socket.IO Client
- DND Kit (Drag & Drop)

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO
- JWT Authentication

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Clerk account

### Backend Setup
Create a file named .env in backend folder and paste this code but remember to replace keys with your credentials

MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/projectmanager?retryWrites=true&w=majority 
JWT_SECRET=your_secret_key_at_least_32_characters_long                                                    
PORT=5000

### Frontend Setup

Create a file named .env in frontend folder and paste this code but remember to replace keys with your credentials

VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
