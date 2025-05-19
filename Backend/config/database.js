const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = () => {
  mongoose
    .connect(process.env.MONGO_URL)
    .then(() => console.log("MongoDb connected successfully"))
    .catch((err) => {
      console.error("Failed to connect to MongoDB", err.message);
      process.exit(1);
    });
};
