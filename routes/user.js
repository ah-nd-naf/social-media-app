const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Get current user profile
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
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
    res.status(500).send("Server error");
  }
});

// Upload profile picture
router.post("/upload-pic", auth, upload.single("profilePic"), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePic: `/uploads/${req.file.filename}` },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

module.exports = router;
