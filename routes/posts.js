// routes/posts.js
const express = require("express");
const authMiddleware = require("../middleware/auth");
const Post = require("../models/Post");
const router = express.Router();

// Import io from server.js (server.js must export io)
const { io } = require("../server");

// Create a post
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const newPost = new Post({
      user: req.user.id,
      text: req.body.text,
      image: req.body.image || "",
    });
    await newPost.save();

    const populatedPost = await Post.findById(newPost._id)
      .populate("user", "username profilePic")
      .populate("comments.user", "username profilePic")
      .populate("comments.replies.user", "username profilePic");

    // Broadcast new post
    io.emit("newPost", populatedPost);

    res.json(populatedPost);
  } catch (err) {
    console.error("POST /create error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", "username profilePic")
      .populate("comments.user", "username profilePic")
      .populate("comments.replies.user", "username profilePic");
    res.json(posts);
  } catch (err) {
    console.error("GET / error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get a single post by ID
router.get("/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("user", "username profilePic")
      .populate("comments.user", "username profilePic")
      .populate("comments.replies.user", "username profilePic");

    if (!post) return res.status(404).json({ msg: "Post not found" });

    res.json(post);
  } catch (err) {
    console.error("GET /:postId error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Like a post
router.put("/like/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    if (post.likes.some((like) => like.toString() === req.user.id)) {
      post.likes = post.likes.filter((like) => like.toString() !== req.user.id);
    } else {
      post.likes.push(req.user.id);
      post.unlikes = post.unlikes.filter((unlike) => unlike.toString() !== req.user.id);
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate("user", "username profilePic")
      .populate("comments.user", "username profilePic")
      .populate("comments.replies.user", "username profilePic");

    io.emit("updatePost", updatedPost);

    res.json(updatedPost);
  } catch (err) {
    console.error("PUT /like/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Unlike a post
router.put("/unlike/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    if (post.unlikes.some((unlike) => unlike.toString() === req.user.id)) {
      post.unlikes = post.unlikes.filter((unlike) => unlike.toString() !== req.user.id);
    } else {
      post.unlikes.push(req.user.id);
      post.likes = post.likes.filter((like) => like.toString() !== req.user.id);
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate("user", "username profilePic")
      .populate("comments.user", "username profilePic")
      .populate("comments.replies.user", "username profilePic");

    io.emit("updatePost", updatedPost);

    res.json(updatedPost);
  } catch (err) {
    console.error("PUT /unlike/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add a comment to a post
router.post("/comment/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const newComment = {
      user: req.user.id,
      text: req.body.text,
      createdAt: Date.now(),
    };

    post.comments.push(newComment);
    await post.save();

    const updatedPost = await Post.findById(req.params.id)
      .populate("user", "username profilePic")
      .populate("comments.user", "username profilePic")
      .populate("comments.replies.user", "username profilePic");

    io.emit("updatePost", updatedPost);

    return res.json(updatedPost.comments);
  } catch (err) {
    console.error("POST /comment/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a comment from a post
router.delete("/comment/:postId/:commentId", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const comment = post.comments.find((c) => c._id.toString() === req.params.commentId);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized to delete this comment" });
    }

    post.comments = post.comments.filter((c) => c._id.toString() !== req.params.commentId);
    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate("user", "username profilePic")
      .populate("comments.user", "username profilePic")
      .populate("comments.replies.user", "username profilePic");

    io.emit("updatePost", updatedPost);

    res.json(updatedPost.comments);
  } catch (err) {
    console.error("DELETE /comment/:postId/:commentId error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add a reply to a comment
router.post("/:postId/comment/:commentId/reply", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    const newReply = {
      user: req.user.id,
      text: req.body.text,
      createdAt: Date.now(),
    };

    // Ensure replies array exists (schema should provide it)
    comment.replies = comment.replies || [];
    comment.replies.push(newReply);
    await post.save();

    const updatedPost = await Post.findById(req.params.postId)
      .populate("user", "username profilePic")
      .populate("comments.user", "username profilePic")
      .populate("comments.replies.user", "username profilePic");

    io.emit("updatePost", updatedPost);

    // return the replies for the comment
    res.json(comment.replies);
  } catch (err) {
    console.error("POST /:postId/comment/:commentId/reply error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a reply
router.delete("/:postId/comment/:commentId/reply/:replyId", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    const reply = comment.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ msg: "Reply not found" });

    if (reply.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized to delete this reply" });
    }

    reply.remove();
    await post.save();

    const updatedPost = await Post.findById(req.params.postId)
      .populate("user", "username profilePic")
      .populate("comments.user", "username profilePic")
      .populate("comments.replies.user", "username profilePic");

    io.emit("updatePost", updatedPost);

    res.json(comment.replies);
  } catch (err) {
    console.error("DELETE /:postId/comment/:commentId/reply/:replyId error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
