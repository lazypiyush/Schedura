const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Project = require('../models/Project');

// Get comments for a task
router.get('/task/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).populate('project');
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    // Check user has access to project
    const project = task.project;
    const isOwner = project.createdBy.toString() === req.user.id;
    const isMember = project.members.some(m => m.toString() === req.user.id);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const comments = await Comment.find({ task: req.params.taskId })
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });
    
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Create comment
router.post('/', auth, async (req, res) => {
  try {
    const { content, task: taskId } = req.body;

    const task = await Task.findById(taskId).populate('project');
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    // Check access
    const project = task.project;
    const isOwner = project.createdBy.toString() === req.user.id;
    const isMember = project.members.some(m => m.toString() === req.user.id);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const comment = new Comment({
      content,
      task: taskId,
      createdBy: req.user.id
    });

    await comment.save();
    
    // Update task comment count
    await Task.findByIdAndUpdate(taskId, { $inc: { commentCount: 1 } });

    const populatedComment = await Comment.findById(comment._id)
      .populate('createdBy', 'name email avatar');

    // Emit socket event
    const io = req.app.get('socketio');
    io.to(project._id.toString()).emit('new-comment', {
      comment: populatedComment,
      taskId
    });

    res.json(populatedComment);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Delete comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ msg: 'Comment not found' });

    // Only creator can delete
    if (comment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    await comment.deleteOne();
    await Task.findByIdAndUpdate(comment.task, { $inc: { commentCount: -1 } });

    res.json({ msg: 'Comment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
