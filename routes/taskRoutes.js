const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Protected routes for tasks (require authentication)
router.post('/', authenticateToken, createTask);
router.get('/', authenticateToken, getTasks);
router.get('/:id', authenticateToken, getTaskById);
router.put('/:id', authenticateToken, updateTask);
router.delete('/:id', authenticateToken, deleteTask);

module.exports = router;