const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// ================= REGISTER =================
const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email and password required",
    });
  }

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, result) => {
      if (err) {
        console.log("DB ERROR:", err);
        return res.status(500).json({ message: "DB Error" });
      }

      if (result.length > 0) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.query(
        "INSERT INTO users(name,email,password) VALUES(?,?,?)",
        [name, email, hashedPassword],
        (err) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ message: "Insert Error" });
          }

          return res.status(201).json({
            message: "User Registered Successfully",
          });
        }
      );
    }
  );
};


// ================= LOGIN =================
const login = (req, res) => {
  console.log("👉 LOGIN HIT");
  console.log("BODY:", req.body);

  const { email, password } = req.body;

  // validation
  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password required",
    });
  }

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, result) => {
      if (err) {
        console.log("DB ERROR:", err);
        return res.status(500).json({ message: "DB Error" });
      }

      if (!result || result.length === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const user = result[0];

      // check password
      let isMatch = false;

      try {
        isMatch = await bcrypt.compare(password, user.password);
      } catch (error) {
        console.log("BCRYPT ERROR:", error);
        return res.status(500).json({
          message: "Password check failed",
        });
      }

      if (!isMatch) {
        return res.status(401).json({
          message: "Invalid Password",
        });
      }

      // JWT check
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({
          message: "JWT_SECRET not found in .env",
        });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return res.status(200).json({
        message: "Login Successful",
        token,
      });
    }
  );
};

module.exports = {
  register,
  login,
};