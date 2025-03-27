const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: String,
  email: String,
  password: String,
  token: String,
  createdAt: Date,
  avatar: {
    type: String,
    default:
      "https://us.123rf.com/450wm/yuliarudenko/yuliarudenko1904/yuliarudenko190400001/122602696-oeuf-d-animal-r%C3%A9aliste-unique-blanc-de-vecteur-oeuf-de-poulet-isol%C3%A9-avec-des-ombres-douces-sur-fond.jpg?ver=6",
  },
});

const User = mongoose.model("users", userSchema);

module.exports = User;
