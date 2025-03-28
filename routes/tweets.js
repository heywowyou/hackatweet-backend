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

// Get tweets that contain a specific hashtag
router.get("/hashtag/:hashtagname", async (req, res) => {
  const hashtagName = "#" + req.params.hashtagname;

  const tweets = await Tweet.find({ hashtags: hashtagName })
    .populate("author", ["username", "email"])
    .populate("likes", ["username"])
    .sort({ date: -1 });

  if (tweets.length === 0) {
    return res.json({
      result: true,
      tweets: [],
      message: "No tweets found with this hashtag",
    });
  }

  res.json({ result: true, tweets });
});

// Hashtags routes

// Return a list of hashtags with their count, sorted by frequency
router.get("/trends", async (req, res) => {
  const tweets = await Tweet.find({}, "hashtags");

  const countMap = {};

  tweets.forEach((tweet) => {
    tweet.hashtags.forEach((tag) => {
      if (!countMap[tag]) {
        countMap[tag] = 1;
      } else {
        countMap[tag]++;
      }
    });
  });

  // Convert object to sorted array
  const trends = Object.entries(countMap)
    .map(([hashtag, count]) => ({ hashtag, count }))
    .sort((a, b) => b.count - a.count);

  res.json({ result: true, trends });

  /*
  {
  "result": true,
  "trends": [
    { "hashtag": "#hackatweet", "count": 4 },
    { "hashtag": "#first", "count": 2 }
  ]
  } 
  */
});

// Get tweets from a specific user
router.get("/user/:username", async (req, res) => {
  const user = await User.findOne({ username: req.params.username });

  if (!user) {
    return res.status(404).json({ result: false, error: "User not found" });
  }

  const tweets = await Tweet.find({ author: user._id })
    .populate("author", "username avatar")
    .sort({ date: -1 });

  res.json({ result: true, tweets });
});

module.exports = router;
