// src/Home.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Home({ user: propUser, setUser: setPropUser }) {
  const [user, setUser] = useState(propUser || null);
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const navigate = useNavigate();
  const commentInputRefs = useRef({});

  // Inline style fallbacks for non-Tailwind setups
  const styles = {
    postAvatar: { width: 40, height: 40, borderRadius: "50%", objectFit: "cover" },
    commentAvatar: { width: 32, height: 32, borderRadius: "50%", objectFit: "cover" },
    profileAvatarLarge: { width: 96, height: 96, borderRadius: "50%", objectFit: "cover" },
  };

  const resolveImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `http://localhost:5000${path}`;
  };

  useEffect(() => {
    if (propUser) setUser(propUser);
    else {
      const token = localStorage.getItem("token");
      if (token) {
        fetch("http://localhost:5000/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((d) => setUser(d))
          .catch(() => {});
      }
    }

    fetch("http://localhost:5000/api/posts")
      .then((r) => r.json())
      .then((data) => setPosts(data.map((p) => ({ ...p, newComment: "", showComments: false }))))
      .catch(() => {});
  }, [propUser]);

  useEffect(() => {
    if (propUser) setUser(propUser);
  }, [propUser]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!text.trim()) return;
    try {
      const res = await fetch("http://localhost:5000/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error();
      const newPost = await res.json();
      setPosts((prev) => [{ ...newPost, newComment: "", showComments: false }, ...prev]);
      setText("");
    } catch (err) {
      console.error(err);
      alert("Could not create post.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    if (setUser) setUser(null);
    if (setPropUser) setPropUser(null);
    navigate("/login");
  };

  const updatePostInState = (updatedPost) => {
    setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? { ...updatedPost, newComment: p.newComment || "", showComments: p.showComments || false } : p)));
  };

  const handleLike = async (postId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/posts/like/${postId}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      updatePostInState(updated);
    } catch (err) { console.error(err); }
  };

  const handleUnlike = async (postId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/posts/unlike/${postId}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      updatePostInState(updated);
    } catch (err) { console.error(err); }
  };

  const toggleComments = (postId) => {
    setPosts((prev) => prev.map((p) => {
      if (p._id === postId) {
        const next = { ...p, showComments: !p.showComments };
        if (!p.showComments) {
          setTimeout(() => {
            const ref = commentInputRefs.current[postId];
            if (ref && ref.focus) ref.focus();
          }, 50);
        }
        return next;
      }
      return p;
    }));
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const post = posts.find((p) => p._id === postId);
    const commentText = (post?.newComment || "").trim();
    if (!commentText) return;
    try {
      const res = await fetch(`http://localhost:5000/api/posts/comment/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: commentText }),
      });
      if (!res.ok) throw new Error();
      const updatedComments = await res.json();
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, comments: updatedComments, newComment: "", showComments: true } : p)));
      setTimeout(() => { const ref = commentInputRefs.current[postId]; if (ref && ref.focus) ref.focus(); }, 50);
    } catch (err) { console.error(err); }
  };

  const handleDeleteComment = async (postId, commentId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/posts/comment/${postId}/${commentId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const updatedComments = await res.json();
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, comments: updatedComments } : p)));
    } catch (err) { console.error(err); }
  };

  const isCommentOwner = (commentUser) => {
    if (!user) return false;
    if (!commentUser) return false;
    if (typeof commentUser === "string") return commentUser === user._id;
    if (commentUser._id) return commentUser._id.toString() === user._id.toString();
    return false;
  };

  const commenterDisplayName = (commentUser) => {
    if (!commentUser) return "User";
    if (typeof commentUser === "string") return commentUser.slice(0, 6);
    if (commentUser.username) return commentUser.username;
    if (commentUser._id) return commentUser._id.toString().slice(0, 6);
    return "User";
  };

  const initials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{user ? `Welcome, ${user.username}!` : "Welcome"}</h1>
        <div className="flex items-center space-x-3">
          <Link to="/profile" className="text-sm text-gray-700 hover:underline">Profile</Link>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">Logout</button>
        </div>
      </div>

      <form onSubmit={handleCreatePost} className="bg-white shadow-md rounded-lg p-4 mb-6">
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="What's on your mind?" className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3 resize-none" />
        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold">Share</button>
      </form>

      <h2 className="text-xl font-semibold mb-4">Recent Posts</h2>

      <div className="space-y-4">
        {posts.map((post) => {
          const liked = user && post.likes?.some((id) => id.toString() === user._id.toString());
          const unliked = user && post.unlikes?.some((id) => id.toString() === user._id.toString());

          return (
            <div key={post._id} className="bg-white shadow-md rounded-lg p-4 border border-gray-100">
              <div className="flex items-start mb-3">
                <div className="flex-shrink-0">
                  {post.user?.profilePic ? (
                    <img
                      src={resolveImageUrl(post.user.profilePic)}
                      alt={post.user.username || "avatar"}
                      style={styles.postAvatar}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src = ""; }}
                    />
                  ) : (
                    <div style={styles.postAvatar} className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center font-bold text-white text-lg">
                      {initials(post.user?.username || (post.user?._id || "U"))}
                    </div>
                  )}
                </div>

                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{post.user?.username || (post.user?._id ? post.user._id.toString().slice(0, 6) : "Unknown")}</p>
                      <small className="text-gray-500 block">{new Date(post.createdAt).toLocaleString()}</small>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-800 mb-3">{post.text}</p>

              <div className="flex space-x-6 text-sm text-gray-600 border-t pt-2">
                <button onClick={() => handleLike(post._id)} title={liked ? "You liked this" : "Like this post"} className={`${liked ? "text-blue-600 font-bold" : "hover:text-blue-600"}`}>👍 Like ({post.likes?.length || 0})</button>
                <button onClick={() => handleUnlike(post._id)} title={unliked ? "You unliked this" : "Unlike this post"} className={`${unliked ? "text-red-600 font-bold" : "hover:text-red-600"}`}>👎 Unlike ({post.unlikes?.length || 0})</button>
                <button onClick={() => toggleComments(post._id)} className="hover:text-blue-600" title="Comment on this post">💬 Comment ({post.comments?.length || 0})</button>
              </div>

              {post.showComments && (
                <div className="mt-4">
                  {post.comments?.length ? (
                    post.comments.map((c) => (
                      <div key={c._id} className="flex items-start mb-3">
                        <div className="flex-shrink-0">
                          {c.user?.profilePic ? (
                            <img
                              src={resolveImageUrl(c.user.profilePic)}
                              alt={c.user.username || "avatar"}
                              style={styles.commentAvatar}
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => { e.target.onerror = null; e.target.src = ""; }}
                            />
                          ) : (
                            <div style={styles.commentAvatar} className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
                              {initials(commenterDisplayName(c.user))}
                            </div>
                          )}
                        </div>

                        <div className="ml-3 flex-1 bg-gray-50 rounded-lg p-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm"><span className="font-semibold">{commenterDisplayName(c.user)}</span></p>
                              <small className="text-gray-500">{new Date(c.createdAt).toLocaleString()}</small>
                            </div>
                            {isCommentOwner(c.user) && (
                              <button onClick={() => handleDeleteComment(post._id, c._id)} className="text-xs text-red-500 hover:underline ml-3">Delete</button>
                            )}
                          </div>

                          <p className="mt-2 text-sm text-gray-800">{c.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 mb-2">No comments yet. Be the first to comment.</p>
                  )}

                  <form onSubmit={(e) => handleAddComment(e, post._id)} className="flex items-center mt-2">
                    <div className="flex-shrink-0 mr-3">
                      {user?.profilePic ? (
                        <img src={resolveImageUrl(user.profilePic)} alt={user.username || "me"} style={styles.commentAvatar} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div style={styles.commentAvatar} className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white">
                          {initials(user?.username || "Me")}
                        </div>
                      )}
                    </div>

                    <input ref={(el) => (commentInputRefs.current[post._id] = el)} type="text" placeholder="Write a comment..." value={post.newComment || ""} onChange={(e) => setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, newComment: e.target.value } : p)))} className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    <button type="submit" className="ml-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm">Post</button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
