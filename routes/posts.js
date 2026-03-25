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

    // ✅ Populate user before sending back
    const populatedPost = await newPost.populate('user', 'username email');
    res.json(populatedPost);
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
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    if (post.likes.includes(req.user.id)) {
      // Already liked → remove like
      post.likes = post.likes.filter(like => like.toString() !== req.user.id);
    } else {
      // Add like
      post.likes.push(req.user.id);
      // If user had unliked before, remove that
      post.unlikes = post.unlikes.filter(unlike => unlike.toString() !== req.user.id);
    }

    await post.save();
    const updatedPost = await post.populate("user", "username email");
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Unlike a post
router.put('/unlike/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    if (post.unlikes.includes(req.user.id)) {
      // Already unliked → remove unlike
      post.unlikes = post.unlikes.filter(unlike => unlike.toString() !== req.user.id);
    } else {
      // Add unlike
      post.unlikes.push(req.user.id);
      // If user had liked before, remove that
      post.likes = post.likes.filter(like => like.toString() !== req.user.id);
    }

    await post.save();
    const updatedPost = await post.populate("user", "username email");
    res.json(updatedPost);
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
