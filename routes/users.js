var express = require("express");
var router = express.Router();
const User = require("../models/users");
const bcrypt = require("bcrypt");
const uid2 = require("uid2");

// Signup route
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ result: false, error: "Missing fields" });
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res
      .status(409)
      .json({ result: false, error: "Username already taken" });
  }

  const hash = await bcrypt.hash(password, 10);

  const newUser = new User({
    username,
    email,
    password: hash,
    token: uid2(32),
    createdAt: new Date(),
  });

  await newUser.save();

  res.json({
    result: true,
    token: newUser.token,
    username: newUser.username,
    email: newUser.email,
    userId: newUser._id,
    avatar: newUser.avatar,
  });
});

// Signin route
router.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ result: false, error: "User not found" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ result: false, error: "Invalid password" });
  }

  res.json({
    result: true,
    token: user.token,
    username: user.username,
    email: user.email,
    userId: user._id,
    avatar: user.avatar,
  });
});

// Toggle follow/unfollow
router.put("/follow", async (req, res) => {
  const { token, targetToken } = req.body;

  const currentUser = await User.findOne({ token });
  const targetUser = await User.findOne({ token: targetToken });

  if (!currentUser || !targetUser) {
    return res.status(404).json({ result: false, error: "User not found" });
  }

  if (currentUser._id.equals(targetUser._id)) {
    return res
      .status(400)
      .json({ result: false, error: "Cannot follow yourself" });
  }

  const alreadyFollowing = currentUser.following.includes(targetUser._id);

  if (alreadyFollowing) {
    currentUser.following.pull(targetUser._id);
    targetUser.followers.pull(currentUser._id);
  } else {
    currentUser.following.push(targetUser._id);
    targetUser.followers.push(currentUser._id);
  }

  await currentUser.save();
  await targetUser.save();

  res.json({ result: true, following: !alreadyFollowing });
});

// Get followers and following
router.get("/connections/:token", async (req, res) => {
  const user = await User.findOne({ token: req.params.token })
    .populate("followers", "username avatar")
    .populate("following", "username avatar");

  if (!user) {
    return res.status(404).json({ result: false, error: "User not found" });
  }

  res.json({
    result: true,
    followers: user.followers,
    following: user.following,
  });
});

// Get user by username
router.get("/:username", async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user)
    return res.status(404).json({ result: false, error: "User not found" });
  res.json({ result: true, user });
});

module.exports = router;
