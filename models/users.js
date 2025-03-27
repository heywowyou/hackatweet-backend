const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: String,
  email: String,
  password: String,
  token: String,
  createdAt: Date,
  avatar: {
    type: String,
    default: "/oeuf.jpg",
  },
});

const User = mongoose.model("users", userSchema);

module.exports = User;
