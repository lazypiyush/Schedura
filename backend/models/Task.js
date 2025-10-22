const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['todo', 'in-progress', 'review', 'done'], 
    default: 'todo' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  assignee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  project: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true 
  },
  dueDate: { 
    type: Date 
  },
  tags: [{ 
    type: String 
  }],
  position: { 
    type: Number, 
    default: 0 
  },
  attachments: [{ 
    type: String 
  }],
  timeEstimate: { 
    type: Number 
  },
  timeSpent: { 
    type: Number, 
    default: 0 
  },
  commentCount: {
    type: Number,
    default: 0
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Task', TaskSchema);
