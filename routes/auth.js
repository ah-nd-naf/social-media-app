const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

/**
 * Multer setup for profile picture uploads
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${req.user ? req.user.id : "anon"}-${Date.now()}${ext}`;
    cb(null, name);
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
 * Creates a new user and returns a token + user (without password)
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
    const safeUser = await User.findById(newUser._id).select("-password");

    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Login
 * Returns token and user (without password)
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    const safeUser = await User.findById(user._id).select("-password");

    res.json({ token, user: safeUser });
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
 * Expects multipart/form-data with field name "profilePic"
 * Returns updated user (username + profilePic)
 */
router.put(
  "/profile-pic",
  authMiddleware,
  upload.single("profilePic"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

      // store the public path to the file
      const profilePicPath = `/uploads/${req.file.filename}`;

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
