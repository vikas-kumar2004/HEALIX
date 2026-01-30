import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import authRoutes from "../src/routes/auth.route.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT;

const __dirname = path.resolve();
// midleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
// heath check route
app.get("/health", (req, res) => {
  res.send("server is working");
});

// all routes handle from here
app.use("/api/auth", authRoutes);



// making our app ready deployment
if (process.env.NODE_ENV == "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontent", "dist", "index.html"));
  });
}
app.listen(PORT, () => {
  console.log(`server is running on ${PORT}`);
});
