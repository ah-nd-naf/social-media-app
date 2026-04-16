const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());

// Allow requests from your frontend origin
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://social-media-app-amber-eight-47.vercel.app"
  ],
  credentials: true
}));


// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// --- Socket.IO setup ---
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://social-media-app-amber-eight-47.vercel.app"
    ],
    credentials: true,
  },
});


io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

module.exports.io = io;

// --- Routes ---
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const postRoutes = require("./routes/posts");
app.use("/api/posts", postRoutes);

const userRoutes = require("./routes/user");
app.use("/api/users", userRoutes);

const newsRoutes = require("./routes/news");
app.use("/api/news", newsRoutes);

// --- Start server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
