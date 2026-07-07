# 🚀 Full-Stack Task Management Web Application

A professional, feature-rich Task Management Web Application built for internship and interview evaluation. This application features user authentication & authorization, complete CRUD operations for tasks, dynamic statistics tracking, customizable filtering and sorting, and optional real-time notification synchronization using WebSockets.

---

## 🌟 Key Features

- **🔐 Secure Authentication & Session Isolation:**
  - Token-based User Login & Registration (JWT)
  - Auto-redirection & Protected Dashboard Routes
  - Isolated User Spaces (Users can only view/mutate their own tasks)

- **📊 Premium Visual Analytics (Dashboard Stats):**
  - **Dynamic Counters:** Total Tasks, Pending Tasks, Completed Tasks, and Active High Priority Tasks cards.
  - **Completion Progress Bar:** Visual progress indicator dynamically calculating the task completion percentage with smooth animation transitions.

- **🛠️ Task Operations & Micro-UX Elements:**
  - Complete CRUD support (Create, Read, Update, Delete)
  - Title, description, priority, and calendar due-date inputs.
  - Color-coded priority badges: **High (Red)**, **Medium (Orange)**, and **Low (Green)**.
  - Overdue alerts highlighted in pulsing red badges.
  - Equal button gaps, responsive layouts, and smooth transition scaling on mouse hovers.

- **🔍 Multi-Filtering & Sorting Systems:**
  - Search tasks dynamically by title keywords.
  - Filter tasks by Status (All, Pending, Completed) and Priority (All, High, Medium, Low).
  - Sort board items by default order, priority level, calendar due date, newest, or oldest creation timestamps.

- **⚡ Real-Time Socket Synchronization:**
  - Integrated Socket.io bindings on the client and server.
  - Emits server changes automatically to keep multiple browser sessions synchronized.

- **📢 Custom Toast Notifications:**
  - Replaced browser `alert()` popups with polished custom floating toast notifications (`react-toastify`).

---

## 🛠️ Technology Stack

- **Frontend:** React.js (Vite compiler), Axios (API client), Socket.io-client, Bootstrap 5 (CSS Framework), React-Toastify.
- **Backend:** Node.js, Express.js (REST APIs), Socket.io (WebSocket Engine), JWT (Session control).
- **Database:** MySQL.

---

## 📂 Project Structure

```text
Task-Management-App/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── api/            # Centralized Axios Client
│   │   ├── pages/          # Login, Register, Dashboard Pages
│   │   ├── App.jsx         # Router & Route Mappings
│   │   └── main.jsx        # Main React Entry Point
│   ├── vercel.json         # Vercel Deployment Configuration
│   └── package.json
└── server/                 # Node.js/Express Backend
    ├── config/             # DB Connection Config
    ├── controllers/        # Controllers for Tasks & Authentication
    ├── middleware/         # Token Verification Middlewares
    ├── routes/             # API Router Handlers
    ├── server.js           # Server Initialization
    └── package.json
```

---

## 💻 Installation & Setup Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed (v16+ recommended).
- [MySQL Server](https://www.mysql.com/) running locally or hosted remotely.

### 2. Database Initialization
Run the following SQL script in your MySQL instance to create the database schema:

```sql
CREATE DATABASE IF NOT EXISTS task_manager;
USE task_manager;

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'Pending',
  priority VARCHAR(50) DEFAULT 'Medium',
  due_date DATE,
  user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3. Backend Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install server dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` folder:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=YOUR_MYSQL_PASSWORD
   DB_NAME=task_manager
   JWT_SECRET=super_secret_key_change_me_in_production
   ```
4. Start the backend server:
   ```bash
   npm run dev
   # or
   node server.js
   ```

### 4. Frontend Setup
1. Navigate to the `client` directory:
   ```bash
   cd ../client
   ```
2. Install client dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173/](http://localhost:5173/) in your web browser.

---

## 🚀 Build for Production
To bundle the frontend for deployment:
```bash
cd client
npm run build
```
This generates optimized static files inside `client/dist/`, which are ready to be uploaded to hosting platforms like Vercel.
