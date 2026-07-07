# 🚀 Full-Stack Task Management Web Application

A modern, secure, and responsive **Task Management Web Application** built for internship and placement evaluation. This application provides user authentication, complete task management, dashboard analytics, advanced filtering, sorting, and real-time synchronization using WebSockets.

The project follows a full-stack architecture with a React frontend, Node.js backend, and MySQL database.

---

# 🌐 Live Demo

### Frontend

🔗 https://keerthi-task-manager.vercel.app/

### Backend API

🔗 https://task-management-application-znag.onrender.com

---

# ✨ Features

## 🔐 Authentication & Authorization

* User Registration and Login
* JWT-based Authentication
* Protected Dashboard Routes
* Secure API Access
* User-specific task isolation
* Password encryption using bcrypt

---

# 📝 Task Management

Users can:

* Create new tasks
* View tasks
* Update existing tasks
* Delete tasks
* Mark tasks as completed
* Manage task descriptions
* Set due dates
* Assign task priorities

Priority Levels:

🔴 High Priority
🟠 Medium Priority
🟢 Low Priority

---

# 📊 Dashboard Analytics

Interactive dashboard containing:

* Total Tasks Count
* Pending Tasks Count
* Completed Tasks Count
* High Priority Tasks Count

Additional analytics:

* Task completion percentage
* Animated progress tracking
* Real-time statistics updates

---

# 🔍 Search, Filter & Sorting

## Search

* Search tasks by title

## Filters

Filter tasks by:

* All Tasks
* Pending Tasks
* Completed Tasks
* Priority Level

## Sorting

Tasks can be sorted by:

* Newest Tasks
* Oldest Tasks
* Due Date
* Priority

---

# ⚡ Real-Time Updates

Implemented using **Socket.io**

Features:

* Real-time task synchronization
* Instant updates across multiple browser sessions
* Automatic refresh without page reload

---

# 🔔 Notifications

Integrated **React Toastify** for user-friendly notifications.

Includes:

* Login success messages
* Registration alerts
* Task creation notifications
* Update confirmations
* Delete confirmations
* Error handling messages

---

# 🎨 UI Features

* Responsive design
* Bootstrap 5 styling
* Mobile-friendly layout
* Smooth hover animations
* Color-coded priority badges
* Clean dashboard interface
* Modern user experience

---

# 🛠 Technology Stack

## Frontend

* React.js
* Vite
* Axios
* React Router DOM
* Bootstrap 5
* React Toastify
* Socket.io Client

## Backend

* Node.js
* Express.js
* JWT Authentication
* Socket.io
* bcrypt.js

## Database

* MySQL

## Deployment

Frontend:

* Vercel

Backend:

* Render

---

# 📂 Project Structure

```text
Task-Management-App
│
├── client
│   ├── src
│   │   ├── api
│   │   ├── components
│   │   ├── pages
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vercel.json
│
└── server
    ├── config
    ├── controllers
    ├── middleware
    ├── routes
    ├── server.js
    └── package.json
```

---

# 🚀 Deployment

## Frontend Deployment

Hosted on:

Vercel

Live URL:

https://keerthi-task-manager.vercel.app/

---

## Backend Deployment

Hosted on:

Render

API URL:

https://task-management-application-znag.onrender.com

---

# 🔮 Future Enhancements

* Dark Mode
* Email Notifications
* Calendar View
* Drag and Drop Tasks
* Team Collaboration
* File Attachments
* Profile Management
* Password Reset
* Admin Dashboard

---

# 👨‍💻 Author

**Chintala Keerthana**

Full Stack Developer

---

# ⭐ Support

If you find this project useful, consider giving it a ⭐ on GitHub.
