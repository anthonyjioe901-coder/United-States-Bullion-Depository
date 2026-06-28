const mongoose = require("mongoose");

let mongoConnected = false;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    mongoConnected = true;
    console.log("MongoDB connected");
  } catch (err) {
    mongoConnected = false;
    console.error("MongoDB connection error:", err.message);
    console.error("Stack trace:", err.stack);
  }
};

connectDB.isMongoConnected = () => mongoConnected;

module.exports = connectDB;
