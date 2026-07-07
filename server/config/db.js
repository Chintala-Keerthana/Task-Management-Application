const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Keerthi@123",
  database: process.env.DB_NAME || "task_manager",
});

db.connect((err) => {
  if (err) {
    console.log("❌ Database Connection Failed!");
    console.log(err);
  } else {
    console.log("✅ MySQL Connected Successfully!");
  }
});

module.exports = db;