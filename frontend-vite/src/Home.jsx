import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  LogOut, 
  User as UserIcon, 
  Newspaper, 
  Send,
  ThumbsDown,
  Trash2,
  MoreVertical
} from "lucide-react";

const BACKEND_URL = "https://social-media-app-6wbl.onrender.com";
const NEWS_API = `${BACKEND_URL}/api/news`;

export default function Home({ user: propUser, setUser: setPropUser }) {
  const [user, setUser] = useState(propUser ?? null);
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [news, setNews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const commentInputRefs = useRef({});
  const socketRef = useRef(null);

  const resolveImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${BACKEND_URL}${path}`;
  };

  const normalizePost = (p) => ({
    ...p,
    user:
      p.user ||
      (p.username || p.userId
        ? {
            username: p.username || (p.user && p.user.username),
            profilePic: p.profilePic,
            id: p.userId || p._id,
          }
        : null),
    text: p.text ?? p.content ?? "",
    likes: Array.isArray(p.likes) ? p.likes : [],
    unlikes: Array.isArray(p.unlikes) ? p.unlikes : [],
    comments: Array.isArray(p.comments) ? p.comments : [],
    newComment: p.newComment ?? "",
    showComments: p.showComments ?? false,
  });

  const dedupeById = (arr = []) => {
    const map = new Map();
    for (const item of arr || []) {
      if (!item) continue;
      const id = (item._id || item.id || "").toString();
      if (id) map.set(id, item);
    }
    return Array.from(map.values());
  };

  useEffect(() => {
    if (propUser) setUser(propUser);
    else {
      const token = localStorage.getItem("token");
      if (token) {
        fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((d) => {
            if (d && d._id) setUser(d);
          })
          .catch(() => {});
      }
    }

    fetch(`${BACKEND_URL}/api/posts`)
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setPosts(arr.map((p) => normalizePost(p)));
      })
      .catch(() => setPosts([]));

    fetch(NEWS_API)
      .then((r) => r.json())
      .then((data) => setNews(Array.isArray(data) ? data : []))
      .catch(() => setNews([]));
  }, [propUser]);

  useEffect(() => {
    socketRef.current = io(BACKEND_URL, { transports: ["websocket", "polling"] });

    socketRef.current.on("newPost", (post) => {
      setPosts((prev) => {
        const id = post?._id || post?.id;
        if (!id) return [normalizePost(post), ...prev];
        if (prev.some((p) => (p._id || p.id) === id)) return prev;
        return [normalizePost(post), ...prev];
      });
    });

    socketRef.current.on("updatePost", (updatedPost) => {
      setPosts((prev) =>
        prev.map((p) => {
          if ((p._id || p.id) !== (updatedPost._id || updatedPost.id)) return p;
          const mergedComments = dedupeById([...(p.comments || []), ...(updatedPost.comments || [])]);
          const merged = { ...p, ...updatedPost, comments: mergedComments };
          return normalizePost(merged);
        })
      );
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initials = (name) => {
    if (!name) return "?";
    return name.toString().split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  };

  const handleCreatePost = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting || !text.trim()) return;
    const token = localStorage.getItem("token");

    setIsSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/posts/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      if (res.ok) setText("");
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsSubmitting(false), 300);
    }
  };

  const sendReaction = async (postId, action) => {
    const token = localStorage.getItem("token");
    const meId = user?.id || user?._id;

    setPosts((prev) =>
      prev.map((p) => {
        if ((p._id || p.id) !== postId) return p;
        const alreadyLiked = meId && p.likes.some((id) => id.toString() === meId.toString());
        const alreadyUnliked = meId && p.unlikes.some((id) => id.toString() === meId.toString());
        let likes = [...p.likes];
        let unlikes = [...p.unlikes];

        if (action === "like") {
          if (alreadyLiked) likes = likes.filter((id) => id.toString() !== meId.toString());
          else {
            likes.push(meId || "me");
            if (alreadyUnliked) unlikes = unlikes.filter((id) => id.toString() !== meId.toString());
          }
        } else {
          if (alreadyUnliked) unlikes = unlikes.filter((id) => id.toString() !== meId.toString());
          else {
            unlikes.push(meId || "me");
            if (alreadyLiked) likes = likes.filter((id) => id.toString() !== meId.toString());
          }
        }
        return { ...p, likes, unlikes };
      })
    );

    try {
      await fetch(`${BACKEND_URL}/api/posts/${action}/${postId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = (postId) => {
    setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, showComments: !p.showComments } : p)));
    setTimeout(() => {
      commentInputRefs.current[postId]?.focus();
    }, 50);
  };

  const handleAddComment = async (e, postId) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem("token");
    const post = posts.find((p) => p._id === postId);
    const commentText = (post?.newComment || "").trim();
    if (!commentText) return;
    try {
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, newComment: "" } : p)));
      await fetch(`${BACKEND_URL}/api/posts/comment/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: commentText }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`${BACKEND_URL}/api/posts/comment/${postId}/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setPropUser(null);
    navigate("/login");
  };

  return (
    <div className="min-h-screen">
      {/* Premium Glass Navbar */}
      <nav className="glass-nav px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gradient">Socially</h1>
          <div className="flex items-center gap-6">
            <Link to="/profile" className="flex items-center gap-2 hover:text-white transition-colors">
              <UserIcon size={20} className="text-purple-400" />
              <span className="hidden sm:inline font-medium">Profile</span>
            </Link>
            <Link to="/news" className="flex items-center gap-2 hover:text-white transition-colors">
              <Newspaper size={20} className="text-cyan-400" />
              <span className="hidden sm:inline font-medium">News</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors">
              <LogOut size={20} />
              <span className="hidden sm:inline font-medium">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <h2 className="text-2xl font-semibold">
            Hello, <span className="text-purple-400">{user?.username || "Friend"}</span>!
          </h2>
        </motion.div>

        {/* Create Post Card */}
        <motion.form 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onSubmit={handleCreatePost} 
          className="glass-card p-6 rounded-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-50" />
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shrink-0">
              {user?.profilePic ? (
                <img src={resolveImageUrl(user.profilePic)} className="w-full h-full rounded-full object-cover" alt="" />
              ) : initials(user?.username)}
            </div>
            <div className="flex-1 space-y-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none placeholder:text-slate-500"
                rows="3"
              />
              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-2">
                  {/* Additional post options could go here */}
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="btn-primary px-6 py-2 rounded-xl flex items-center gap-2 font-semibold disabled:opacity-50"
                >
                  <Send size={18} />
                  {isSubmitting ? "Sharing..." : "Share Post"}
                </button>
              </div>
            </div>
          </div>
        </motion.form>

        {/* Posts Feed */}
        <div className="space-y-6">
          <h3 className="text-xl font-medium text-slate-400">Recent Activity</h3>
          <AnimatePresence mode="popLayout">
            {posts.map((post, index) => {
              const liked = user && post.likes.some((id) => id.toString() === (user._id || user.id)?.toString());
              const unliked = user && post.unlikes.some((id) => id.toString() === (user._id || user.id)?.toString());

              return (
                <motion.div
                  key={post._id || post.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card rounded-2xl p-6"
                >
                  {/* Post Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-semibold">
                        {post.user?.profilePic ? (
                          <img src={resolveImageUrl(post.user.profilePic)} className="w-full h-full rounded-full object-cover" alt="" />
                        ) : initials(post.user?.username)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-200">
                          {post.user?.username || "Anonymous"}
                        </h4>
                        <span className="text-xs text-slate-500">
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "Just now"}
                        </span>
                      </div>
                    </div>
                    <button className="text-slate-500 hover:text-white">
                      <MoreVertical size={20} />
                    </button>
                  </div>

                  {/* Post Content */}
                  <p className="text-slate-300 text-lg leading-relaxed mb-6">
                    {post.text}
                  </p>

                  {/* Post Actions */}
                  <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                    <button 
                      onClick={() => sendReaction(post._id || post.id, "like")}
                      className={`flex items-center gap-2 transition-all ${liked ? 'text-purple-400 scale-110' : 'text-slate-400 hover:text-purple-400'}`}
                    >
                      <Heart size={20} fill={liked ? "currentColor" : "none"} />
                      <span className="text-sm font-medium">{post.likes?.length || 0}</span>
                    </button>

                    <button 
                      onClick={() => sendReaction(post._id || post.id, "unlike")}
                      className={`flex items-center gap-2 transition-all ${unliked ? 'text-cyan-400 scale-110' : 'text-slate-400 hover:text-cyan-400'}`}
                    >
                      <ThumbsDown size={20} fill={unliked ? "currentColor" : "none"} />
                      <span className="text-sm font-medium">{post.unlikes?.length || 0}</span>
                    </button>

                    <button 
                      onClick={() => toggleComments(post._id || post.id)}
                      className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                      <MessageCircle size={20} />
                      <span className="text-sm font-medium">{post.comments?.length || 0}</span>
                    </button>

                    <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors ml-auto">
                      <Share2 size={20} />
                    </button>
                  </div>

                  {/* Comments Section */}
                  <AnimatePresence>
                    {post.showComments && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-6 pt-6 border-t border-white/5 space-y-4 overflow-hidden"
                      >
                        {/* Comment List */}
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                          {post.comments.map((c) => (
                            <div key={c._id || c.id} className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-700 shrink-0 flex items-center justify-center text-xs font-bold">
                                {c.user?.profilePic ? (
                                  <img src={resolveImageUrl(c.user.profilePic)} className="w-full h-full rounded-full object-cover" alt="" />
                                ) : initials(c.user?.username || "U")}
                              </div>
                              <div className="flex-1 bg-white/5 rounded-2xl px-4 py-2 relative group">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-semibold text-purple-300">
                                    {c.user?.username || "User"}
                                  </span>
                                  {(c.user?._id === user?._id || c.user?.id === user?._id) && (
                                    <button 
                                      onClick={() => handleDeleteComment(post._id || post.id, c._id || c.id)}
                                      className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                                <p className="text-sm text-slate-300">{c.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Comment Input */}
                        <form 
                          onSubmit={(e) => handleAddComment(e, post._id || post.id)}
                          className="flex gap-2 items-center"
                        >
                          <input
                            ref={(el) => (commentInputRefs.current[post._id || post.id] = el)}
                            type="text"
                            placeholder="Write a comment..."
                            value={post.newComment || ""}
                            onChange={(e) =>
                              setPosts((prev) => prev.map((p) => ((p._id || p.id) === post._id ? { ...p, newComment: e.target.value } : p)))
                            }
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                          />
                          <button type="submit" className="text-purple-400 hover:text-purple-300">
                            <Send size={20} />
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

