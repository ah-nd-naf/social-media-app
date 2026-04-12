const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

/**
 * Ensure upload folder exists
 */
const uploadDir = path.join(__dirname, "..", "uploads", "profile-pics");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Multer setup for profile picture uploads
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * Signup
 */
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user: await User.findById(newUser._id).select("-password") });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Login
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user: await User.findById(user._id).select("-password") });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get current user
 */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Upload or update profile picture
 */
router.put(
  "/profile-pic",
  authMiddleware,
  upload.single("profilePic"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

      const profilePicPath = `/uploads/profile-pics/${req.file.filename}`;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { profilePic: profilePicPath },
        { new: true }
      ).select("-password");

      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
