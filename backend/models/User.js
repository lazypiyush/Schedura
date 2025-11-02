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
  },
  profilePhoto: { // ✅ ALIAS for avatar (for consistency)
    type: String, 
    default: '' 
  }
}, { 
  timestamps: true 
});

// ✅ Virtual field to sync avatar and profilePhoto
UserSchema.virtual('photo').get(function() {
  return this.avatar || this.profilePhoto;
});

module.exports = mongoose.model('User', UserSchema);
