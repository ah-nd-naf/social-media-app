const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload folder exists
const uploadDir = path.join(__dirname, "../uploads/profile-pics");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, req.user.id + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Get current user profile
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).send("Server error");
  }
});

// Update profile (username + bio)
router.put("/update", auth, async (req, res) => {
  const { username, bio } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username, bio },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).send("Server error");
  }
});

// Upload profile picture
router.post("/upload-pic", auth, upload.single("profilePic"), async (req, res) => {
  try {
    if (!req.file) {
      console.error("No file received. req.body:", req.body);
      return res.status(400).json({ msg: "No file uploaded" });
    }

    console.log("File received:", req.file);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePic: `/uploads/profile-pics/${req.file.filename}` },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
