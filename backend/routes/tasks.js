const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Project = require('../models/Project');

// Get all tasks for a project (check user has access)
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    // First verify user has access to this project
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    // Check if user is owner or member
    const isOwner = project.createdBy.toString() === req.user.id;
    const isMember = project.members.some(memberId => memberId.toString() === req.user.id);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    // User has access - return tasks
    const tasks = await Task.find({ project: req.params.projectId })
      .sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create a task (check user has access to project)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, project: projectId } = req.body;
    
    // Verify user has access to this project
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    const isOwner = project.createdBy.toString() === req.user.id;
    const isMember = project.members.some(memberId => memberId.toString() === req.user.id);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    // Create task
    const task = new Task({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate,
      project: projectId,
      createdBy: req.user.id
    });
    
    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update task (check user has access)
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Check user has access to the project this task belongs to
    const project = task.project;
    const isOwner = project.createdBy.toString() === req.user.id;
    const isMember = project.members.some(memberId => memberId.toString() === req.user.id);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    // Update task
    const { title, description, status, priority, dueDate } = req.body;
    
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    
    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete task (check user has access)
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Check user has access
    const project = task.project;
    const isOwner = project.createdBy.toString() === req.user.id;
    const isMember = project.members.some(memberId => memberId.toString() === req.user.id);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    await task.deleteOne();
    res.json({ msg: 'Task deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
