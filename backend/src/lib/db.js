import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB_URI);
    console.log("Connected to mongoDB", conn.connection.host);
  } catch (error) {
    console.log("Error in connecting to mongoDB");
  }
};
