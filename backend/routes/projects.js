const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all projects for logged-in user (with tasks)
router.get('/', auth, async (req, res) => {
  try {
    const Task = require('../models/Task');
    
    const projects = await Project.find({
      $or: [
        { createdBy: req.user.id },
        { members: req.user.id }
      ]
    })
    .populate('createdBy', 'name email')
    .populate('members', 'name email')
    .sort({ createdAt: -1 });

    // Fetch tasks for each project
    const projectsWithTasks = await Promise.all(
      projects.map(async (project) => {
        const tasks = await Task.find({ project: project._id });
        const projectObj = project.toObject();
        projectObj.tasks = tasks;
        return projectObj;
      })
    );

    res.json(projectsWithTasks);
  } catch (err) {
    console.error('Error fetching projects:', err.message);
    res.status(500).send('Server error');
  }
});



// Get project by ID (only if user is a member)
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    if (
      !project ||
      (
        project.createdBy._id.toString() !== req.user.id &&
        !project.members.some(m => m._id.toString() === req.user.id)
      )
    ) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
});

// Create project (attach creator as createdBy/owner and first member)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, color } = req.body;

    if (!title) {
      return res.status(400).json({ msg: 'Project title is required' });
    }

    const newProject = new Project({
      title,
      description: description || '',
      color: color || '#1976D2',
      createdBy: req.user.id,
      members: [req.user.id],
    });

    const project = await newProject.save();

    const populatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    res.json(populatedProject);
  } catch (err) {
    console.error('Error creating project:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Update project (only owner)
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, color } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    if (title) project.title = title;
    if (description !== undefined) project.description = description;
    if (color) project.color = color;

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    res.json(updatedProject);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete project (only owner)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Project removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add member to project (only owner)
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { email } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found with this email' });
    }
    if (project.members.some(member => member.toString() === user._id.toString())) {
      return res.status(400).json({ msg: 'User is already a member' });
    }
    project.members.push(user._id);
    await project.save();

    const updatedProject = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    res.json(updatedProject);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Remove member from project (only owner)
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    project.members = project.members.filter(
      member => member.toString() !== req.params.userId
    );
    await project.save();

    const updatedProject = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');
    res.json(updatedProject);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
