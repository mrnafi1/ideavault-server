const express = require("express");
const jwt     = require("jsonwebtoken");

const authRoutes = (usersCollection) => {
  const router = express.Router();

  
  router.post("/jwt", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.json({ token });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate token", error: error.message });
    }
  });

  
  router.post("/logout", (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  return router;
};

module.exports = authRoutes;
