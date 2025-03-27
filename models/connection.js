const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const connectionString = process.env.MONGO_DB_URL;

mongoose
  .connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log("Database connected"))
  .catch((error) => console.error(error));
