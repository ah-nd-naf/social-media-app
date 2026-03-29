import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { io } from "socket.io-client";

const BACKEND_URL = "http://localhost:5000";
const NEWS_API = `${BACKEND_URL}/api/news`;

export default function Home({ user: propUser, setUser: setPropUser }) {
  const [user, setUser] = useState(propUser || null);
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const navigate = useNavigate();
  const commentInputRefs = useRef({});
  const socketRef = useRef(null);

  const AVATAR_SIZE = 40;
  const COMMENT_AVATAR_SIZE = 32;

  const [news, setNews] = useState([]);

  const styles = {
    postAvatar: {
      display: "block",
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: "50%",
      objectFit: "cover",
      margin: 0,
      padding: 0,
      flexShrink: 0,
    },
    commentAvatar: {
      display: "block",
      width: COMMENT_AVATAR_SIZE,
      height: COMMENT_AVATAR_SIZE,
      borderRadius: "50%",
      objectFit: "cover",
      margin: 0,
      padding: 0,
      flexShrink: 0,
    },
    avatarRow: { display: "flex", alignItems: "center", gap: 6, marginBottom: 12 },
    commentRow: { display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 },
    nameBlock: { marginLeft: 0, lineHeight: 1.05 },
    nameP: { margin: 0, lineHeight: 1.05, fontWeight: 600 },
    nameSmall: { margin: 0, lineHeight: 1.05, color: "var(--text)" },
    commentBubble: { background: "var(--code-bg, #f8fafc)", borderRadius: 10, padding: "8px 10px" },
  };

  const resolveImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${BACKEND_URL}${path}`;
  };

  // Normalize a post object coming from server
  const normalizePost = (p) => ({
    ...p,
    user:
      p.user ||
      (p.username || p.userId
        ? {
            username: p.username || (p.user && p.user.username),
            profilePic: p.profilePic,
            _id: p.userId || p._id,
          }
        : null),
    text: p.text ?? p.content ?? "",
    likes: Array.isArray(p.likes) ? p.likes : [],
    unlikes: Array.isArray(p.unlikes) ? p.unlikes : [],
    comments: Array.isArray(p.comments) ? p.comments : [],
    newComment: p.newComment ?? "",
    showComments: p.showComments ?? false,
  });

  // Helper: dedupe by id/_id
  const dedupeById = (arr = []) => {
    const map = new Map();
    for (const item of arr || []) {
      if (!item) continue;
      const id = (item._id || item.id || "").toString();
      if (id) map.set(id, item);
    }
    return Array.from(map.values());
  };

  // Initial fetch + keep propUser in sync
  useEffect(() => {
    if (propUser) setUser(propUser);
    else {
      const token = localStorage.getItem("token");
      if (token) {
        fetch(`${BACKEND_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((d) => setUser(d))
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

    // fetch news
    fetch(NEWS_API)
      .then((r) => r.json())
      .then((data) => {
        setNews(Array.isArray(data) ? data : []);
      })
      .catch(() => setNews([]));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propUser]);

  // Socket.IO connection for real-time updates (register once, idempotent)
  useEffect(() => {
    socketRef.current = io(BACKEND_URL, { transports: ["websocket", "polling"] });

    socketRef.current.on("connect", () => {
      // connected
    });

    socketRef.current.on("newPost", (post) => {
      setPosts((prev) => {
        if (prev.some((p) => p._id === post._id)) return prev;
        return [normalizePost(post), ...prev];
      });
    });

    socketRef.current.on("updatePost", (updatedPost) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id !== updatedPost._id) return p;
          // merge existing and incoming comments and dedupe by id
          const mergedComments = dedupeById([...(p.comments || []), ...(updatedPost.comments || [])]);
          const merged = { ...p, ...updatedPost, comments: mergedComments };
          return normalizePost(merged);
        })
      );
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("newPost");
        socketRef.current.off("updatePost");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Helpers
  const initials = (name) => {
    if (!name) return "?";
    return name
      .toString()
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const commenterDisplayName = (commentUser) => {
    if (!commentUser) return "User";
    if (typeof commentUser === "string") return commentUser.slice(0, 6);
    if (commentUser.username) return commentUser.username;
    if (commentUser._id) return commentUser._id.toString().slice(0, 6);
    return "User";
  };

  const isCommentOwner = (commentUser) => {
    if (!user) return false;
    if (!commentUser) return false;
    if (typeof commentUser === "string") return commentUser === user.id || commentUser === user._id;
    if (commentUser.id) return commentUser.id.toString() === (user.id || user._id)?.toString();
    if (commentUser._id) return commentUser._id.toString() === (user._id || user.id)?.toString();
    return false;
  };

  // Create post
  const handleCreatePost = async (e) => {
    e?.preventDefault?.();
    const token = localStorage.getItem("token");
    if (!text.trim()) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/posts/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error();
      const newPost = await res.json();
      setPosts((prev) => [normalizePost(newPost), ...prev]);
      setText("");
    } catch (err) {
      console.error(err);
      alert("Could not create post.");
    }
  };

  // Reaction (like/unlike) with optimistic UI and reconciliation
  const sendReaction = async (postId, action) => {
    const token = localStorage.getItem("token");
    const meId = user?.id || user?._id;

    // optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id !== postId) return p;
        const alreadyLiked = meId && p.likes?.some((id) => id.toString() === meId.toString());
        const alreadyUnliked = meId && p.unlikes?.some((id) => id.toString() === meId.toString());
        let likes = Array.isArray(p.likes) ? [...p.likes] : [];
        let unlikes = Array.isArray(p.unlikes) ? [...p.unlikes] : [];

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
      const endpoints = [
        { method: "PUT", url: `${BACKEND_URL}/api/posts/${action}/${postId}` },
        { method: "POST", url: `${BACKEND_URL}/api/posts/${postId}/${action}` },
        { method: "POST", url: `${BACKEND_URL}/api/posts/${action}/${postId}` },
      ];
      let updated = null;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep.url, { method: ep.method, headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) continue;
          updated = await res.json();
          break;
        } catch {
          continue;
        }
      }
      if (updated && updated._id) {
        setPosts((prev) => prev.map((p) => (p._id === updated._id ? normalizePost(updated) : p)));
      } else {
        // fallback: re-fetch
        const all = await fetch(`${BACKEND_URL}/api/posts`).then((r) => r.json());
        setPosts((Array.isArray(all) ? all : []).map((p) => normalizePost(p)));
      }
    } catch (err) {
      console.error(err);
      fetch(`${BACKEND_URL}/api/posts`)
        .then((r) => r.json())
        .then((data) => setPosts((Array.isArray(data) ? data : []).map((p) => normalizePost(p))))
        .catch(() => {});
    }
  };

  // Toggle comments visibility
  const toggleComments = (postId) => {
    setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, showComments: !p.showComments } : p)));
    setTimeout(() => {
      const ref = commentInputRefs.current[postId];
      if (ref && ref.focus) ref.focus();
    }, 50);
  };

  // Add comment: send to server, clear input locally, rely on socket for final UI update
  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const post = posts.find((p) => p._id === postId);
    const commentText = (post?.newComment || "").trim();
    if (!commentText) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/posts/comment/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: commentText }),
      });

      // Clear the input immediately; server will emit updatePost/newPost and socket handler will merge comments
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, newComment: "" } : p)));

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Add comment failed" }));
        console.error("Add comment failed:", err);
      }
    } catch (err) {
      console.error("Add comment error:", err);
    }
  };

  // Add reply: send to server, clear reply input locally, rely on socket for final UI update
  const handleAddReply = async (e, postId, commentId) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const post = posts.find((p) => p._id === postId);
    const comment = post?.comments?.find((c) => c._id === commentId);
    const replyText = (comment?.newReply || "").trim();
    if (!replyText) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/posts/${postId}/comment/${commentId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: replyText }),
      });

      // Clear the reply input locally; server will emit updatePost and socket handler will merge replies
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, comments: p.comments.map((c) => (c._id === commentId ? { ...c, newReply: "" } : c)) } : p
        )
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Add reply failed" }));
        console.error("Add reply failed:", err);
      }
    } catch (err) {
      console.error("Add reply error:", err);
    }
  };

  // Delete comment
  const handleDeleteComment = async (postId, commentId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${BACKEND_URL}/api/posts/comment/${postId}/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const updatedComments = await res.json();
      if (Array.isArray(updatedComments)) {
        setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, comments: updatedComments } : p)));
      } else if (updatedComments && updatedComments._id) {
        setPosts((prev) => prev.map((p) => (p._id === postId ? normalizePost(updatedComments) : p)));
      } else {
        const all = await fetch(`${BACKEND_URL}/api/posts`).then((r) => r.json());
        setPosts((Array.isArray(all) ? all : []).map((p) => normalizePost(p)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete reply
  const handleDeleteReply = async (postId, commentId, replyId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${BACKEND_URL}/api/posts/${postId}/comment/${commentId}/reply/${replyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const updatedComment = await res.json();
      if (updatedComment && updatedComment._id) {
        setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, comments: p.comments.map((c) => (c._id === commentId ? updatedComment : c)) } : p)));
      } else {
        const all = await fetch(`${BACKEND_URL}/api/posts`).then((r) => r.json());
        setPosts((Array.isArray(all) ? all : []).map((p) => normalizePost(p)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    if (setUser) setUser(null);
    if (setPropUser) setPropUser(null);
    navigate("/login");
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-bold">{user ? `Welcome, ${user.username}` : "Welcome"}</h1>
        <div className="flex items-center space-x-3">
          <Link to="/profile" className="text-sm text-gray-700 hover:underline">
            Profile
          </Link>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">
            Logout
          </button>
        </div>
      </div>

      {/* Latest News */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Latest News</h2>
        <div className="space-y-3">
          {news.length === 0 ? (
            <p className="text-sm text-gray-500">Loading news...</p>
          ) : (
            news.map((n, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded-lg shadow-sm">
                <a href={n.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline">
                  {n.title}
                </a>
                <div className="text-xs text-gray-500 mt-1">{n.pubDate ? new Date(n.pubDate).toLocaleString() : ""}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <form onSubmit={handleCreatePost} className="bg-white shadow-md rounded-lg p-4 mb-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3 resize-none"
        />
        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold">
          Share
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-4">Recent Posts</h2>

      <div className="space-y-4">
        {posts.map((post) => {
          const liked = user && Array.isArray(post.likes) && post.likes.some((id) => id.toString() === (user._id || user.id)?.toString());
          const unliked = user && Array.isArray(post.unlikes) && post.unlikes.some((id) => id.toString() === (user._id || user.id)?.toString());

          return (
            <div key={post._id} className="bg-white shadow-md rounded-lg p-4 border border-gray-100">
              <div style={styles.avatarRow}>
                {post.user?.profilePic ? (
                  <img
                    src={resolveImageUrl(post.user.profilePic)}
                    alt={post.user.username || "avatar"}
                    style={styles.postAvatar}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "";
                    }}
                  />
                ) : (
                  <div
                    style={{
                      ...styles.postAvatar,
                      background: "linear-gradient(90deg, #60a5fa, #8b5cf6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 700,
                    }}
                  >
                    {initials(post.user?.username || post.user?._id || "U")}
                  </div>
                )}

                <div style={styles.nameBlock}>
                  <p style={styles.nameP}>{post.user?.username || (post.user?._id ? post.user._id.toString().slice(0, 6) : "Unknown")}</p>
                  <small style={styles.nameSmall}>{post.createdAt ? new Date(post.createdAt).toLocaleString() : ""}</small>
                </div>
              </div>

              <p className="text-gray-800 mb-3">{post.text}</p>

              <div className="flex space-x-6 text-sm text-gray-600 border-t pt-2">
                <button onClick={() => sendReaction(post._id, "like")} title={liked ? "You liked this" : "Like this post"} className={liked ? "text-blue-600 font-bold" : "hover:text-blue-600"}>
                  Like ({post.likes?.length || 0})
                </button>

                <button onClick={() => sendReaction(post._id, "unlike")} title={unliked ? "You unliked this" : "Unlike this post"} className={unliked ? "text-red-600 font-bold" : "hover:text-red-600"}>
                  Unlike ({post.unlikes?.length || 0})
                </button>

                <button onClick={() => toggleComments(post._id)} className="hover:text-blue-600">
                  Comment ({post.comments?.length || 0})
                </button>
              </div>

              {post.showComments && (
                <div className="mt-4">
                  {post.comments?.length ? (
                    post.comments.map((c) => (
                      <div key={c._id} style={styles.commentRow}>
                        {c.user?.profilePic ? (
                          <img
                            src={resolveImageUrl(c.user.profilePic)}
                            alt={c.user.username || "avatar"}
                            style={styles.commentAvatar}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "";
                            }}
                          />
                        ) : (
                          <div style={{ ...styles.commentAvatar, background: "#d1d5db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                            {initials(commenterDisplayName(c.user))}
                          </div>
                        )}

                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ lineHeight: 1.05 }}>
                              <p style={{ margin: 0, fontWeight: 600 }}>{commenterDisplayName(c.user)}</p>
                              <small style={{ margin: 0, color: "var(--text)" }}>{c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}</small>
                            </div>

                            <div style={{ marginLeft: "auto" }}>{isCommentOwner(c.user) && <button onClick={() => handleDeleteComment(post._id, c._id)} className="text-xs text-red-500 hover:underline">Delete</button>}</div>
                          </div>

                          <div style={{ marginTop: 6 }}>
                            <div style={styles.commentBubble}>
                              <p style={{ margin: 0 }} className="text-sm text-gray-800">
                                {c.text}
                              </p>
                            </div>
                          </div>

                          {/* replies */}
                          {c.replies?.length > 0 && (
                            <div className="mt-2 ml-10 space-y-2">
                              {c.replies.map((r) => (
                                <div key={r._id} className="text-sm text-gray-700">
                                  <span className="font-semibold mr-2">{r.user?.username || (typeof r.user === "string" ? r.user.slice(0, 6) : "User")}</span>
                                  <span className="text-gray-600">{r.text}</span>
                                  {isCommentOwner(r.user) && (
                                    <button onClick={() => handleDeleteReply(post._id, c._id, r._id)} className="ml-3 text-xs text-red-500 hover:underline">
                                      Delete
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* reply form */}
                          <form onSubmit={(e) => handleAddReply(e, post._id, c._id)} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                            {user?.profilePic ? (
                              <img src={resolveImageUrl(user.profilePic)} alt={user.username || "me"} style={styles.commentAvatar} />
                            ) : (
                              <div style={{ ...styles.commentAvatar, background: "linear-gradient(90deg, #10b981, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
                                {initials(user?.username || "Me")}
                              </div>
                            )}

                            <input
                              type="text"
                              placeholder="Write a reply..."
                              value={c.newReply || ""}
                              onChange={(e) =>
                                setPosts((prev) =>
                                  prev.map((p) => (p._id === post._id ? { ...p, comments: p.comments.map((com) => (com._id === c._id ? { ...com, newReply: e.target.value } : com)) } : p))
                                )
                              }
                              className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <button type="submit" className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm">
                              Reply
                            </button>
                          </form>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 mb-2">No comments yet. Be the first to comment.</p>
                  )}

                  <form onSubmit={(e) => handleAddComment(e, post._id)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {user?.profilePic ? (
                      <img src={resolveImageUrl(user.profilePic)} alt={user.username || "me"} style={styles.commentAvatar} />
                    ) : (
                      <div style={{ ...styles.commentAvatar, background: "linear-gradient(90deg, #10b981, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
                        {initials(user?.username || "Me")}
                      </div>
                    )}

                    <input
                      ref={(el) => (commentInputRefs.current[post._id] = el)}
                      type="text"
                      placeholder="Write a comment..."
                      value={post.newComment || ""}
                      onChange={(e) => setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, newComment: e.target.value } : p)))}
                      className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button type="submit" className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm">
                      Post
                    </button>
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
