import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import API from "../api/axios";

// Helper to decode JWT payload natively
const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
};

const safeGetItem = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

const safeRemoveItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
};

function Dashboard() {
  const navigate = useNavigate();
  const titleInputRef = useRef(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [tasks, setTasks] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Search, Filter & Sort State
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("none");

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
   (task) => task.status === "Completed"
  ).length;

  
  // Auth check & socket connection on mount
  useEffect(() => {
    const token = safeGetItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    fetchTasks();

    // Decode user ID and initialize WebSocket client
    const decoded = parseJwt(token);
    const userId = decoded?.id;
    const socket = io("http://localhost:5000");

    if (userId) {
      socket.emit("join", userId);
      console.log(`Connected to socket room user_${userId}`);
    }

    // Listener for real-time task mutations from other sessions
    socket.on("tasks_changed", (data) => {
      fetchTasks();
      if (data?.message) {
        toast.info(data.message);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  // Fetch Tasks
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await API.get("/tasks");
      setTasks(res.data);
    } catch (err) {
      console.log(err);
      if (err.response?.status === 401) {
        safeRemoveItem("token");
        navigate("/");
      } else {
        toast.error("Failed to load tasks");
      }
    } finally {
      setLoading(false);
    }
  };

  // Add Task
  const addTask = async () => {
    if (!title) {
      toast.warning("Task Title is required");
      return;
    }

    try {
      const res = await API.post("/tasks/add", {
        title,
        description,
        status: "Pending",
        priority,
        due_date: dueDate || null,
      });

      toast.success(res.data.message || "Task added successfully!");
      await fetchTasks(); 
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setDueDate("");
    } catch (err) {
      console.log(err);
      toast.error("Failed to add task");
    }
  };

  // Delete Task
  const deleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }
    try {
      const res = await API.delete(`/tasks/${id}`);
      toast.success(res.data.message || "Task deleted successfully!");
    } catch (err) {
      console.log(err);
      toast.error("Failed to delete task");
    }
  };

  // Edit Task
  const editTask = (task) => {
    setEditId(task.id);
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority || "Medium");
    
    if (task.due_date) {
      try {
        const date = new Date(task.due_date);
        if (!isNaN(date.getTime())) {
          const formattedDate = date.toISOString().split("T")[0];
          setDueDate(formattedDate);
        } else {
          setDueDate("");
        }
      } catch (e) {
        setDueDate("");
      }
    } else {
      setDueDate("");
    }
    
    toast.info("Editing task details");
    
    // Smooth scroll to the form panel at the top and focus the input field
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
  };

  // Update Task
  const updateTask = async () => {
    try {
      const currentTask = tasks.find((t) => t.id === editId);
      const status = currentTask ? currentTask.status : "Pending";

      const res = await API.put(`/tasks/${editId}`, {
        title,
        description,
        status,
        priority,
        due_date: dueDate || null,
      });

      toast.success(res.data.message || "Task updated successfully!");
      await fetchTasks(); 
      setEditId(null);
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setDueDate("");
    } catch (err) {
      console.log(err);
      toast.error("Failed to update task");
    }
  };

  // Change Status
  const changeStatus = async (task) => {
    try {
      const newStatus = task.status === "Pending" ? "Completed" : "Pending";
      const res = await API.patch(`/tasks/${task.id}/status`, {
        status: newStatus,
      });
      toast.success(res.data.message || "Task status updated!");
    } catch (err) {
      console.log(err);
      toast.error("Failed to update status");
    }
  };

  // Logout Handler
  const handleLogout = () => {
    safeRemoveItem("token");
    navigate("/");
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  // Check if date is overdue
  const isOverdue = (dateStr, status) => {
    if (!dateStr || status === "Completed") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateObj = new Date(dateStr);
    dueDateObj.setHours(0, 0, 0, 0);
    return dueDateObj < today;
  };

  // Stats calculation
  const totalCount = tasks.length;
  const pendingCount = tasks.filter((t) => t.status !== "Completed").length;
  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const highPriorityCount = tasks.filter((t) => t.priority === "High" && t.status !== "Completed").length;

  const completionRate =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100);


  // Search + Filter Logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter = filter === "All" || task.status === filter;
    const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;

    return matchesSearch && matchesFilter && matchesPriority;
  });

  // Sort Logic
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "dueDate") {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    }
    if (sortBy === "priority") {
      const priorityWeights = { High: 3, Medium: 2, Low: 1 };
      return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
    }
    if (sortBy === "newest") {
      return new Date(b.created_at || b.id) - new Date(a.created_at || a.id);
    }
    if (sortBy === "oldest") {
      return new Date(a.created_at || a.id) - new Date(b.created_at || b.id);
    }
    return 0; // default
  });

  return (
    <div className="container mt-4 mb-5 text-start">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark mb-4 rounded-4 shadow-sm px-4 py-3" style={{ background: "linear-gradient(135deg, #1f2029 0%, #16171d 100%)", border: "1px solid var(--border)" }}>
        <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
          <span className="navbar-brand mb-0 h1 fs-4" style={{ fontWeight: "700", letterSpacing: "-0.5px" }}>
            Task Dashboard 🚀
          </span>
          <button className="btn btn-outline-danger btn-sm px-3 rounded-pill" onClick={handleLogout} style={{ fontWeight: "600" }}>
            Logout 🚪
          </button>
        </div>
      </nav>

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card p-3 border-0 rounded-4 shadow-sm text-white stats-card" style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="opacity-75 mb-1" style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "0.5px" }}>TOTAL TASKS</h6>
                <h3 className="mb-0 fw-bold">{totalCount}</h3>
              </div>
              <div className="bg-white bg-opacity-20 rounded-3 shadow-sm d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card p-3 border-0 rounded-4 shadow-sm text-white stats-card" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="opacity-75 mb-1" style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "0.5px" }}>PENDING TASKS</h6>
                <h3 className="mb-0 fw-bold">{pendingCount}</h3>
              </div>
              <div className="bg-white bg-opacity-20 rounded-3 shadow-sm d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card p-3 border-0 rounded-4 shadow-sm text-white stats-card" style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="opacity-75 mb-1" style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "0.5px" }}>COMPLETED TASKS</h6>
                <h3 className="mb-0 fw-bold">{completedCount}</h3>
              </div>
              <div className="bg-white bg-opacity-20 rounded-3 shadow-sm d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card p-3 border-0 rounded-4 shadow-sm text-white stats-card" style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="opacity-75 mb-1" style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "0.5px" }}>HIGH PRIORITY</h6>
                <h3 className="mb-0 fw-bold">{highPriorityCount}</h3>
              </div>
              <div className="bg-white bg-opacity-20 rounded-3 shadow-sm d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Progress */}
<div
  className="mb-4 p-3 rounded-4 shadow-sm progress-card"
  style={{
    background: "#fff",
    border: "1px solid #ececec"
  }}
>
  <div className="d-flex justify-content-between align-items-center mb-2">
    <div>
      <h6
        className="mb-0 fw-bold"
        style={{ color: "var(--text-h)" }}
      >
        📊 Completion Progress
      </h6>
      <small className="text-muted">
        {completedTasks} of {totalTasks} tasks completed
      </small>
    </div>

    <span
      className="fw-bold px-3 py-1 rounded-pill"
      style={{
        background: "rgba(123,97,255,0.12)",
        color: "#7b61ff",
      }}
    >
      {completionRate}%
    </span>
    
  </div>

  <div
    className="progress"
    style={{
      height: "12px",
      borderRadius: "30px",
      background: "#ececec",
      overflow: "hidden",
    }}
  >
    <div
      className="progress-bar progress-bar-striped progress-bar-animated"
      role="progressbar"
      style={{
        width: `${completionRate}%`,
        background:
          "linear-gradient(90deg,#7b61ff,#9d4edd,#4facfe,#00c9a7)",
        transition: "width .8s ease",
      }}
    ></div>
  </div>
</div>

      {/* Main Grid: Control Panel & Tasks List */}
      <div className="row g-4">
        {/* Task Form Panel */}
        <div className="col-lg-4">
          <div className="card p-4 shadow-sm add-task-card" style={{background: "#fff", border: "1px solid #ececec"}}>
            <h4 className="mb-4" style={{ color: "var(--text-h)", fontWeight: "600" }}>
              {editId ? "✏️ Edit Task" : "➕ Add New Task"}
            </h4>

            {/* Clean input fields matching standard forms */}
            <div className="mb-3">
              <label className="form-label" style={{ fontWeight: "600" }}>Task Title</label>
              <input
                ref={titleInputRef}
                type="text"
                className="form-control rounded-3"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ fontWeight: "600" }}>Description</label>
              <textarea
                className="form-control rounded-3"
                rows="3"
                placeholder="Add some details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            <div className="row g-2 mb-4">
              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: "600" }}>Priority</label>
                <select
                  className="form-select rounded-3"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label" style={{ fontWeight: "600" }}>Due Date</label>
                <input
                  type="date"
                  className="form-control rounded-3"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="d-flex gap-2">
              {editId ? (
                <>
                  <button 
                  className="btn btn-success w-100 py-2 rounded-3" onClick={updateTask} 
                  >
                    Update Task
                  </button>

                  <button 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setEditId(null);
                      setTitle("");
                      setDescription("");
                      setPriority("Medium");
                      setDueDate("");
                  }}>
                    Cancel
                  </button>
                </>
              ) : (
            <button
             className="btn btn-primary w-100 py-2 rounded-3"
             onClick={addTask}
            >
                Add Task
            </button>
     )}
            
              
            </div>
          </div>
        </div>

        {/* Task List Panel */}
        <div className="col-lg-8">
            
            {/* Search, Filter and Sort controls - Rearranged neatly */}
            <div className="row g-3 align-items-center mb-4">
              <div className="col-lg-4 col-md-12">
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0" style={{ color: "var(--text)" }}>🔍</span>
                  <input
                    type="text"
                    className="form-control border-start-0 rounded-end-3"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0" style={{ color: "var(--text)" }}>⇅</span>
                  <select
                    className="form-select border-start-0 rounded-end-3"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ background: "var(--bg)", color: "var(--text)" }}
                  >
                    <option value="none">Sort: Default</option>
                    <option value="priority">Sort: Priority</option>
                    <option value="dueDate">Sort: Due Date</option>
                    <option value="newest">Sort: Newest</option>
                    <option value="oldest">Sort: Oldest</option>
                  </select>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0" style={{ color: "var(--text)" }}>🏁</span>
                  <select
                    className="form-select border-start-0 rounded-end-3"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    style={{ background: "var(--bg)", color: "var(--text)" }}
                  >
                    <option value="All">Priority: All</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="col-lg-4 col-md-4 text-md-end">
                <div className="btn-group shadow-sm w-100" role="group" aria-label="Task Status Filters">
                  <button
                    className={`btn btn-sm px-3 ${filter === "All" ? "btn-dark" : "btn-outline-dark"}`}
                    onClick={() => setFilter("All")}
                  >
                    All
                  </button>
                  <button
                    className={`btn btn-sm px-3 ${filter === "Pending" ? "btn-warning text-dark" : "btn-outline-warning"}`}
                    onClick={() => setFilter("Pending")}
                  >
                    Pending
                  </button>
                  <button
                    className={`btn btn-sm px-3 ${filter === "Completed" ? "btn-success" : "btn-outline-success"}`}
                    onClick={() => setFilter("Completed")}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>

            {/* Tasks Container */}
            {/* Your Tasks Header Card Wrapper */}
            <div className="card p-4 border-0 rounded-4 shadow-sm mb-4 tasks-header-card" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="fs-1">📋</div>
                  <div>
                    <h2 className="mb-1 fw-bold" style={{ fontSize: "28px", color: "var(--text-h)", letterSpacing: "-0.5px" }}>
                      Your Tasks
                    </h2>
                    <p className="text-muted mb-0" style={{ fontSize: "14px", fontWeight: "500" }}>
                      Manage and track all your tasks
                    </p>
                  </div>
                </div>
                <div>
                  <span className="badge rounded-pill px-3 py-2 fs-6" style={{ background: "var(--accent-bg)", color: "var(--accent)", border: "1px solid var(--accent-border)", fontWeight: "600" }}>
                    {sortedTasks.length} {sortedTasks.length === 1 ? "Task" : "Tasks"}
                  </span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" style={{ color: "var(--accent) !important" }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted" style={{ fontSize: "15px" }}>Syncing task board...</p>
              </div>
            ) : sortedTasks.length === 0 ? (
              <div className="text-center py-5 rounded-4 animate-fade-in" style={{ background: "rgba(0,0,0,0.01)", border: "1px dashed var(--border)" }}>
                <div className="mb-2 opacity-50">
                  <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                </div>
                <p className="mb-0 text-muted fs-6">No Tasks Found</p>
                <small className="text-muted">Fill out the task panel on the left to add your first item.</small>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {sortedTasks.map((task) => {
                  // Subtle Tailwind-like modern badges styling
                  let priorityBadgeClass = "badge-low";
                  let borderLeftColor = "#3b82f6";
                  if (task.priority === "Medium") {
                    priorityBadgeClass = "badge-medium";
                    borderLeftColor = "#f59e0b";
                  } else if (task.priority === "High") {
                    priorityBadgeClass = "badge-high";
                    borderLeftColor = "#ef4444";
                  }

                  const expired = isOverdue(task.due_date, task.status);

                  return (
                    <div
                      key={task.id}
                      className="card p-3 border-0 rounded-4 shadow-sm task-card animate-fade-in"
                      style={{
                        background: "var(--bg)",
                        borderLeft: `6px solid ${borderLeftColor}`,
                        boxShadow: "rgba(0, 0, 0, 0.04) 0px 4px 12px",
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div className="text-start flex-grow-1" style={{ maxWidth: "70%" }}>
                          <h5
                            className={task.status === "Completed" ? "text-decoration-line-through text-muted" : ""}
                            style={{
                              fontWeight: "600",
                              fontSize: "18px",
                              color: task.status === "Completed" ? "var(--text)" : "var(--text-h)",
                              marginBottom: "4px"
                            }}
                          >
                            {task.title}
                          </h5>
                          {task.description && (
                            <p className="mb-2 text-muted" style={{ fontSize: "14px", lineHeight: "140%" }}>{task.description}</p>
                          )}
                          
                          <div className="d-flex flex-wrap gap-2 align-items-center mt-2">
                            {/* Status Badge */}
                            <span className={`badge rounded-pill d-flex align-items-center gap-1 ${task.status === "Completed" ? "badge-status-completed" : "badge-status-pending"}`} style={{ fontSize: "11px", fontWeight: "600", padding: "5px 10px" }}>
                              {task.status === "Completed" && (
                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                              )}
                              {task.status}
                            </span>
                            
                            {/* Priority Badge */}
                            <span className={`badge rounded-pill d-flex align-items-center gap-1 ${priorityBadgeClass}`} style={{ fontSize: "11px", fontWeight: "600", padding: "5px 10px" }}>
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                              {task.priority || "Medium"}
                            </span>

                            {/* Due Date Badge */}
                            {task.due_date && (
                              <span className={`badge rounded-pill d-flex align-items-center gap-1 ${expired ? "badge-date-overdue animate-pulse" : "badge-date-normal"}`} style={{ fontSize: "11px", fontWeight: "600", padding: "5px 10px" }}>
                                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                {formatDate(task.due_date)} {expired ? "(Overdue)" : ""}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons (Larger, more attractive) */}
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <button
                            className={`btn btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-1 action-complete-btn ${task.status === "Pending" ? "btn-success" : "btn-secondary"}`}
                            onClick={() => changeStatus(task)}
                            style={{ fontSize: "13px", fontWeight: "600" }}
                          >
                            {task.status === "Pending" ? "✓ Complete" : "⟲ Reopen"}
                          </button>
                          
                          <button
                            className="btn btn-outline-warning btn-sm action-btn p-2 rounded-3"
                            onClick={() => editTask(task)}
                            title="Edit Task"
                            style={{ border: "1px solid rgba(245, 158, 11, 0.3)" }}
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                          </button>
                          
                          <button
                            className="btn btn-outline-danger btn-sm action-btn p-2 rounded-3"
                            onClick={() => deleteTask(task.id)}
                            title="Delete Task"
                            style={{ border: "1px solid rgba(239, 68, 68, 0.3)" }}
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>

      {/* React Toastify Toast Container */}
      <ToastContainer position="bottom-right" autoClose={4000} theme="colored" />

      {/* Premium Styles */}
      <style>{`
        /* Form Buttons Hover Effect */
        .form-btn {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
          color: white !important;
        }
        .form-btn:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 8px 20px rgba(170, 59, 255, 0.35) !important;
        }
          
        /* Action buttons Hover */
        .action-btn {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .action-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15) !important;
        }
        .action-btn.btn-outline-warning:hover {
          background-color: #f59e0b !important;
          color: #fff !important;
          border-color: #f59e0b !important;
        }
        .action-btn.btn-outline-danger:hover {
          background-color: #ef4444 !important;
          color: #fff !important;
          border-color: #ef4444 !important;
        }

        .action-complete-btn {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .action-complete-btn:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15) !important;
        }
        .action-complete-btn.btn-success:hover {
          background-color: #047857 !important;
          border-color: #047857 !important;
        }
        .action-complete-btn.btn-secondary:hover {
          background-color: #4b5563 !important;
          border-color: #4b5563 !important;
        }

        /* Modern Subtle Badges */
        .badge-low {
          background-color: rgba(16, 185, 129, 0.1) !important;
          color: #059669 !important;
          border: 1px solid rgba(16, 185, 129, 0.2) !important;
        }
        .badge-medium {
          background-color: rgba(245, 158, 11, 0.1) !important;
          color: #d97706 !important;
          border: 1px solid rgba(245, 158, 11, 0.2) !important;
        }
        .badge-high {
          background-color: rgba(239, 68, 68, 0.1) !important;
          color: #dc2626 !important;
          border: 1px solid rgba(239, 68, 68, 0.2) !important;
        }
        .badge-status-completed {
          background-color: rgba(16, 185, 129, 0.1) !important;
          color: #059669 !important;
          border: 1px solid rgba(16, 185, 129, 0.2) !important;
        }
        .badge-status-pending {
          background-color: rgba(107, 114, 128, 0.1) !important;
          color: #4b5563 !important;
          border: 1px solid rgba(107, 114, 128, 0.2) !important;
        }
        .badge-date-normal {
          background-color: rgba(107, 114, 128, 0.05) !important;
          color: #4b5563 !important;
          border: 1px solid rgba(107, 114, 128, 0.15) !important;
        }
        .badge-date-overdue {
          background-color: rgba(239, 68, 68, 0.15) !important;
          color: #dc2626 !important;
          border: 1px solid rgba(239, 68, 68, 0.3) !important;
        }

        /* Animations */
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-pulse {
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            opacity: 1;
          }
        }
        /* Dynamic Stats Cards Hover */
        .stats-card {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
        }
        .stats-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15) !important;
        }
        
        /* Completion Progress Card Hover */
        .progress-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .progress-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 12px 24px rgba(123, 97, 255, 0.18) !important;
       }
        .progress-bar {
            background-size: 200% 200%;
            animation: moveGradient 2s linear infinite;
        }       

        @keyframes moveGradient {
           0% { background-position: 0% 50%; }
           100% { background-position: 100% 50%; }
        }

        
        /* Add New Task Card Hover */
        .add-task-card {
         transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s ease;
        }

        .add-task-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15) !important;
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          box-shadow: 0 8px 20px rgba(99,102,241,0.3);
        }
        .task-card {
          margin-bottom: 12px;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .task-card:hover {
          transform: translateY(-5px);
          box-shadow: rgba(0, 0, 0, 0.1) 0px 12px 24px !important;
          border-left: 4px solid #7b61ff;
        }
        .task-card:active {
           transform: scale(0.98);
        }
        .btn:hover {
          transform: scale(1.05);
        }

        /* Inputs styling to match light/dark mode and prevent white-box flashing */
        .form-control, .form-select {
          background-color: var(--bg) !important;
          color: var(--text-h) !important;
          border-color: var(--border) !important;
        }
        .form-control:focus, .form-select:focus {
          background-color: var(--bg) !important;
          color: var(--text-h) !important;
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 0.25rem var(--accent-bg) !important;
        }
        .input-group-text {
          border-color: var(--border) !important;
          color: var(--text) !important;
          background-color: transparent !important;
        }
        /* Your Tasks Header Card Hover */
        .tasks-header-card {
         transition: all 0.3s ease;
         cursor: pointer;
        }

        .tasks-header-card:hover {
        transform: translateY(-4px) scale(1.01);
        box-shadow: 0 12px 25px rgba(0,0,0,0.12) !important;
        }
        * {
           scroll-behavior: smooth;
          }

      `}</style>
    </div>
  );
}

export default Dashboard;