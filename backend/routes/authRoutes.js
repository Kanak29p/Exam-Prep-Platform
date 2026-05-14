const express = require("express");
const router = express.Router();

const connection = require("../db/snowflake");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/authMiddleware");


// LOGIN ROUTE
router.post("/login", async (req, res) => {

  const { email, password } = req.body;

  const query = `
    SELECT * FROM userdetails
    WHERE email='${email}'
  `;

  connection.execute({
    sqlText: query,

    complete: function (err, stmt, rows) {

      // DATABASE ERROR
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      // USER NOT FOUND
      if (rows.length === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const user = rows[0];

      // WRONG PASSWORD
      if (user.PASSWORD !== password) {
        return res.status(401).json({
          message: "Invalid password",
        });
      }

      // GENERATE JWT TOKEN
      const token = jwt.sign(
        {
          email: user.EMAIL,
          id: user.ID,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );

      // SUCCESS RESPONSE
      return res.json({
        message: "Login successful",
        token,
      });
    },
  });
});


// PROTECTED DASHBOARD ROUTE
router.get("/dashboard", verifyToken, (req, res) => {

  res.json({
    message: "Welcome to dashboard",
    user: req.user,
  });

});


module.exports = router;