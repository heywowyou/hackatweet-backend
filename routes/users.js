var express = require("express");
var router = express.Router();
const User = require("../models/users");
const bcrypt = require("bcrypt");
const uid2 = require("uid2");

// Signup route
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  // Check if all fields are filled
  if (!username || !email || !password) {
    return res.status(400).json({ result: false, error: "Missing fields" });
  }

  // Check if username is available
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res
      .status(409)
      .json({ result: false, error: "Username already taken" });
  }

  // Hash the password
  const hash = await bcrypt.hash(password, 10);

  // Create and save the new user
  const newUser = new User({
    username,
    email,
    password: hash,
    token: uid2(32),
    createdAt: new Date(),
  });

  await newUser.save();

  // Return success + user info
  res.json({
    result: true,
    token: newUser.token,
    username: newUser.username,
    email: newUser.email,
    userId: newUser._id,
  });
});

// Signin route
router.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  // Find user by username
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ result: false, error: "User not found" });
  }

  // Compare given password with hashed password
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ result: false, error: "Invalid password" });
  }

  // Return success + user info
  res.json({
    result: true,
    token: user.token,
    username: user.username,
    email: user.email,
    userId: user._id,
  });
});

module.exports = router;
