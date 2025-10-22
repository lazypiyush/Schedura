const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Sync user with Clerk
router.post('/sync', async (req, res) => {
  try {
    const { clerkId, email, name, avatar } = req.body;
    
    console.log('========================================');
    console.log('🔍 SYNC REQUEST:');
    console.log('Clerk ID:', clerkId);
    console.log('Email:', email);
    console.log('Avatar:', avatar);
    console.log('========================================');

    // Find or create user
    let user = await User.findOne({ clerkId });
    
    if (!user) {
      user = new User({ clerkId, email, name, avatar: avatar || '' });
      await user.save();
      console.log('✅ NEW USER CREATED');
      console.log('MongoDB _id:', user._id.toString());
    } else {
      console.log('👤 EXISTING USER FOUND');
      console.log('MongoDB _id:', user._id.toString());
      
      // Update avatar if changed
      if (avatar && user.avatar !== avatar) {
        user.avatar = avatar;
        await user.save();
        console.log('🖼️ Avatar updated');
      }
    }

    // IMPORTANT: Use user._id (MongoDB ID) in the token
    const token = jwt.sign(
      { user: { id: user._id.toString() } },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('🎫 TOKEN GENERATED');
    console.log('========================================');

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name,
        avatar: user.avatar 
      } 
    });
  } catch (err) {
    console.error('❌ Sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
