const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  changeStatus,
} = require("../controllers/taskController");

// Protect all task routes
router.use(verifyToken);

// Create Task
router.post("/add", createTask);

// Get All Tasks
router.get("/", getTasks);

// Update Task
router.put("/:id", updateTask);

// Change Task Status
router.patch("/:id/status", changeStatus);

// Delete Task
router.delete("/:id", deleteTask);

module.exports = router;