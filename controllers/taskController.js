const Task = require('../models/Task');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  const { name, description, dueDate, dueTime, priority, category, duration } = req.body;

  // Basic validation
  if (!name || !dueDate || !dueTime) {
    return res.status(400).json({ message: 'Please include a name, due date, and due time for the task' });
  }

  try {
    const newTask = new Task({
      userId: req.user.id, // User ID from authenticated token
      name,
      description,
      dueDate,
      dueTime,
      priority,
      category,
      duration
    });

    const createdTask = await newTask.save();
    res.status(201).json(createdTask);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all tasks for the authenticated user
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ dueDate: 1, dueTime: 1 });
    res.json(tasks);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single task by ID for the authenticated user
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error(error.message);
    // Handle invalid ObjectId format
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid task ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a task for the authenticated user
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  const { name, description, dueDate, dueTime, priority, category, status, duration } = req.body;

  try {
    let task = await Task.findOne({ _id: req.params.id, userId: req.user.id });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or not authorized' });
    }

    // Update task fields
    task.name = name || task.name;
    task.description = description || task.description;
    task.dueDate = dueDate || task.dueDate;
    task.dueTime = dueTime || task.dueTime;
    task.priority = priority || task.priority;
    task.category = category || task.category;
    task.status = status || task.status;
    task.duration = duration || task.duration;

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid task ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a task for the authenticated user
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or not authorized' });
    }

    res.json({ message: 'Task removed' });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid task ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};