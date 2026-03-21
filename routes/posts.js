const express = require('express');
const authMiddleware = require('../middleware/auth');
const Post = require('../models/Post');
const router = express.Router();

// Create a post
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const newPost = new Post({
      user: req.user.id,
      text: req.body.text,
      image: req.body.image || ''
    });
    await newPost.save();
    res.json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().populate('user', 'username email');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
