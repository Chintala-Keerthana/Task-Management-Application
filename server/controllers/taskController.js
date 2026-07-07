const db = require("../config/db");

// Create Task
const createTask = (req, res) => {
  const { title, description, status, priority, due_date } = req.body;
  const userId = req.user.id;

  if (!title) {
    return res.status(400).json({
      message: "Title is required",
    });
  }

  db.query(
    "INSERT INTO tasks (title, description, status, priority, due_date, user_id) VALUES (?, ?, ?, ?, ?, ?)",
    [title, description, status || "Pending", priority || "Medium", due_date || null, userId],
    (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: "Database Error",
        });
      }

      // Emit real-time notification
      if (req.io) {
        req.io.to(`user_${userId}`).emit("tasks_changed", {
          action: "create",
          message: `Task "${title}" created successfully!`,
        });
      }

      res.status(201).json({
        message: "Task Created Successfully",
      });
    }
  );
};

// Get All Tasks for logged-in user
const getTasks = (req, res) => {
  const userId = req.user.id;

  db.query("SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC", [userId], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Database Error",
      });
    }

    res.status(200).json(result);
  });
};

// Update Task
const updateTask = (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, due_date } = req.body;
  const userId = req.user.id;

  db.query(
    "UPDATE tasks SET title=?, description=?, status=?, priority=?, due_date=? WHERE id=? AND user_id=?",
    [title, description, status, priority || "Medium", due_date || null, id, userId],
    (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: "Database Error",
        });
      }

      // Emit real-time notification
      if (req.io) {
        req.io.to(`user_${userId}`).emit("tasks_changed", {
          action: "update",
          message: `Task "${title}" updated successfully!`,
        });
      }

      res.status(200).json({
        message: "Task Updated Successfully",
      });
    }
  );
};

// Delete Task
const deleteTask = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.query("DELETE FROM tasks WHERE id=? AND user_id=?", [id, userId], (err) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Database Error",
      });
    }

    // Emit real-time notification
    if (req.io) {
      req.io.to(`user_${userId}`).emit("tasks_changed", {
        action: "delete",
        message: "Task deleted successfully!",
      });
    }

    res.status(200).json({
      message: "Task Deleted Successfully",
    });
  });
};

// Change Task Status
const changeStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  db.query(
    "UPDATE tasks SET status=? WHERE id=? AND user_id=?",
    [status, id, userId],
    (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: "Database Error",
        });
      }

      // Emit real-time notification
      if (req.io) {
        req.io.to(`user_${userId}`).emit("tasks_changed", {
          action: "status",
          message: `Task status updated to "${status}"!`,
        });
      }

      res.status(200).json({
        message: "Status Updated Successfully",
      });
    }
  );
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  changeStatus,
};