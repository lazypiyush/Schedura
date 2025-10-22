const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  clerkId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'manager', 'member'], 
    default: 'member' 
  },
  avatar: { 
    type: String, 
    default: '' 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('User', UserSchema);
