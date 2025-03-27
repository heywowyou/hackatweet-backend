const express = require("express");
const router = express.Router();
const Tweet = require("../models/tweets");
const User = require("../models/users");

// Post tweet route

// Create a new tweet
router.post("/", async (req, res) => {
  const { content, token } = req.body;

  if (!content || !token) {
    return res
      .status(400)
      .json({ result: false, error: "Missing content or token" });
  }

  const user = await User.findOne({ token });
  if (!user) {
    return res.status(401).json({ result: false, error: "Invalid token" });
  }

  // Extract hashtags from content
  const hashtags = content.match(/#\w+/g) || [];

  const newTweet = new Tweet({
    content,
    date: new Date(),
    likes: [],
    hashtags,
    author: user._id,
  });

  await newTweet.save();

  res.json({ result: true, tweet: newTweet });
});

// Get tweets route

// Get all tweets, newest first, with author info
router.get("/", async (req, res) => {
  const tweets = await Tweet.find()
    .populate("author", ["username", "email"])
    .populate("likes", ["username"])
    .sort({ date: -1 });

  res.json({ result: true, tweets });
});

// Route delete tweet

// Delete a tweet only if it belongs to the logged-in user
router.delete("/:id", async (req, res) => {
  const { token } = req.body;

  const user = await User.findOne({ token });
  if (!user) {
    return res.status(401).json({ result: false, error: "Invalid token" });
  }

  const tweet = await Tweet.findById(req.params.id);
  if (!tweet) {
    return res.status(404).json({ result: false, error: "Tweet not found" });
  }

  if (!tweet.author.equals(user._id)) {
    return res.status(403).json({ result: false, error: "Unauthorized" });
  }

  await Tweet.findByIdAndDelete(req.params.id);
  res.json({ result: true });
});

// Like or unlike a tweet

// Toggle like: if user has liked, remove it; otherwise, add it
router.put("/like/:id", async (req, res) => {
  const { token } = req.body;

  const user = await User.findOne({ token });
  if (!user) {
    return res.status(401).json({ result: false, error: "Invalid token" });
  }

  const tweet = await Tweet.findById(req.params.id);
  if (!tweet) {
    return res.status(404).json({ result: false, error: "Tweet not found" });
  }

  const userId = user._id.toString();
  const alreadyLiked = tweet.likes.some((like) => like.toString() === userId);

  if (alreadyLiked) {
    // Remove like
    tweet.likes = tweet.likes.filter((like) => like.toString() !== userId);
  } else {
    // Add like
    tweet.likes.push(user._id);
  }

  await tweet.save();
  res.json({ result: true, liked: !alreadyLiked });
});

module.exports = router;
