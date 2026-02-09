const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Atlas 연결 성공");
  } catch (error) {
    console.error("❌ MongoDB 연결 실패:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
