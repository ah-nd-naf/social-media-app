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

// Get a single post by ID
router.get('/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate('user', 'username email');

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like a post
router.put('/like/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // If post not found
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Check if user already liked
    if (post.likes.includes(req.user.id)) {
      return res.status(400).json({ msg: 'Post already liked' });
    }

    // Add user to likes array
    post.likes.push(req.user.id);
    await post.save();

    res.json(post.likes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unlike a post
router.put('/unlike/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // If post not found
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Check if user has not liked yet
    if (!post.likes.includes(req.user.id)) {
      return res.status(400).json({ msg: 'Post has not been liked yet' });
    }

    // Remove user from likes array
    post.likes = post.likes.filter(like => like.toString() !== req.user.id);
    await post.save();

    res.json(post.likes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a comment to a post
router.post('/comment/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // If post not found
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Create new comment object
    const newComment = {
      user: req.user.id,
      text: req.body.text,
      createdAt: Date.now()
    };

    // Add comment to post
    post.comments.push(newComment);
    await post.save();

    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a comment from a post
router.delete('/comment/:postId/:commentId', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    // If post not found
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Find the comment
    const comment = post.comments.find(
      (c) => c._id.toString() === req.params.commentId
    );

    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    // Only the comment owner can delete
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to delete this comment' });
    }

    // Remove the comment
    post.comments = post.comments.filter(
      (c) => c._id.toString() !== req.params.commentId
    );

    await post.save();

    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
