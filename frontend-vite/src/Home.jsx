// src/pages/Home.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Home({ user: propUser, setUser: setPropUser }) {
  const [user, setUser] = useState(propUser || null);
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const navigate = useNavigate();
  const commentInputRefs = useRef({});

  const AVATAR_SIZE = 40;
  const COMMENT_AVATAR_SIZE = 32;
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
    avatarRow: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 12,
    },
    commentRow: {
      display: "flex",
      alignItems: "flex-start",
      gap: 8,
      marginBottom: 12,
    },
    nameBlock: {
      marginLeft: 0,
      lineHeight: 1.05,
    },
    nameP: {
      margin: 0,
      lineHeight: 1.05,
      fontWeight: 600,
    },
    nameSmall: {
      margin: 0,
      lineHeight: 1.05,
      color: "var(--text)",
    },
    commentBubble: {
      background: "var(--code-bg, #f8fafc)",
      borderRadius: 10,
      padding: "8px 10px",
    },
  };

  const resolveImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `http://localhost:5000${path}`;
  };

  useEffect(() => {
    if (propUser) {
      setUser(propUser);
    } else {
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
      .then((data) =>
        setPosts(
          (Array.isArray(data) ? data : []).map((p) => ({
            ...p,
            user: p.user || (p.username || p.userId ? { username: p.username, profilePic: p.profilePic, _id: p.userId || p._id } : null),
            text: p.text ?? p.content ?? "",
            likes: Array.isArray(p.likes) ? p.likes : [],
            unlikes: Array.isArray(p.unlikes) ? p.unlikes : [],
            comments: Array.isArray(p.comments) ? p.comments : [],
            newComment: "",
            showComments: false,
          }))
        )
      )
      .catch(() => {
        setPosts([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const poster = newPost.user || { username: newPost.username, profilePic: newPost.profilePic, _id: newPost.userId };
      setPosts((prev) => [{ ...newPost, user: poster, newComment: "", showComments: false }, ...prev]);
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

  const updatePostInState = (updatedPostOrComments) => {
    if (!updatedPostOrComments) return;
    if (updatedPostOrComments._id) {
      const updatedPost = {
        ...updatedPostOrComments,
        user: updatedPostOrComments.user || { username: updatedPostOrComments.username, profilePic: updatedPostOrComments.profilePic },
        likes: Array.isArray(updatedPostOrComments.likes) ? updatedPostOrComments.likes : [],
        unlikes: Array.isArray(updatedPostOrComments.unlikes) ? updatedPostOrComments.unlikes : [],
        comments: Array.isArray(updatedPostOrComments.comments) ? updatedPostOrComments.comments : [],
      };
      setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? { ...p, ...updatedPost, newComment: p.newComment || "", showComments: p.showComments || false } : p)));
    } else {
      console.warn("updatePostInState received comments array without post id — no-op");
    }
  };

  const sendReactionRequest = async (postId, action) => {
    const token = localStorage.getItem("token");
    const endpointsToTry = [
      { method: "PUT", url: `http://localhost:5000/api/posts/${action}/${postId}` },
      { method: "POST", url: `http://localhost:5000/api/posts/${postId}/${action}` },
      { method: "POST", url: `http://localhost:5000/api/posts/${action}/${postId}` },
    ];

    for (const ep of endpointsToTry) {
      try {
        const res = await fetch(ep.url, { method: ep.method, headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) continue;
        const data = await res.json();
        return data;
      } catch (err) {
        continue;
      }
    }
    throw new Error(`${action} failed on all tried endpoints`);
  };

  const handleLike = async (postId) => {
    const meId = user?._id;
    setPosts((prev) =>
      prev.map((p) => {
        if (p._1d !== postId && p._id !== postId) return p;
        const alreadyLiked = meId && p.likes?.some((id) => id.toString() === meId.toString());
        const alreadyUnliked = meId && p.unlikes?.some((id) => id.toString() === meId.toString());
        let likes = Array.isArray(p.likes) ? [...p.likes] : [];
        let unlikes = Array.isArray(p.unlikes) ? [...p.unlikes] : [];
        if (alreadyLiked) likes = likes.filter((id) => id.toString() !== meId.toString());
        else {
          likes.push(meId || "me");
          if (alreadyUnliked) unlikes = unlikes.filter((id) => id.toString() !== meId.toString());
        }
        return { ...p, likes, unlikes };
      })
    );

    try {
      const updated = await sendReactionRequest(postId, "like");
      if (updated && updated._id) {
        updatePostInState(updated);
      } else {
        const res = await fetch("http://localhost:5000/api/posts");
        const data = await res.json();
        if (Array.isArray(data)) {
          setPosts(
            data.map((p) => ({
              ...p,
              newComment: "",
              showComments: false,
              likes: p.likes || [],
              unlikes: p.unlikes || [],
              comments: p.comments || [],
              user: p.user || { username: p.username, profilePic: p.profilePic },
            }))
          );
        }
      }
    } catch (err) {
      console.error(err);
      fetch("http://localhost:5000/api/posts")
        .then((r) => r.json())
        .then((data) => setPosts(data.map((p) => ({ ...p, newComment: "", showComments: false }))))
        .catch(() => {});
    }
  };

  const handleUnlike = async (postId) => {
    const meId = user?._id;
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id !== postId) return p;
        const alreadyUnliked = meId && p.unlikes?.some((id) => id.toString() === meId.toString());
        const alreadyLiked = meId && p.likes?.some((id) => id.toString() === meId.toString());
        let likes = Array.isArray(p.likes) ? [...p.likes] : [];
        let unlikes = Array.isArray(p.unlikes) ? [...p.unlikes] : [];
        if (alreadyUnliked) unlikes = unlikes.filter((id) => id.toString() !== meId.toString());
        else {
          unlikes.push(meId || "me");
          if (alreadyLiked) likes = likes.filter((id) => id.toString() !== meId.toString());
        }
        return { ...p, likes, unlikes };
      })
    );

    try {
      const updated = await sendReactionRequest(postId, "unlike");
      if (updated && updated._id) {
        updatePostInState(updated);
      } else {
        const res = await fetch("http://localhost:5000/api/posts");
        const data = await res.json();
        if (Array.isArray(data)) {
          setPosts(data.map((p) => ({ ...p, newComment: "", showComments: false })));
        }
      }
    } catch (err) {
      console.error(err);
      fetch("http://localhost:5000/api/posts")
        .then((r) => r.json())
        .then((data) => setPosts(data.map((p) => ({ ...p, newComment: "", showComments: false }))))
        .catch(() => {});
    }
  };

  const toggleComments = (postId) => {
    setPosts((prev) =>
      prev.map((p) => {
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
      })
    );
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
      const result = await res.json();
      if (Array.isArray(result)) {
        setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, comments: result, newComment: "", showComments: true } : p)));
      } else if (result && result._id) {
        setPosts((prev) => prev.map((p) => (p._id === postId ? { ...result, newComment: "", showComments: true } : p)));
      } else {
        const all = await fetch("http://localhost:5000/api/posts").then((r) => r.json());
        setPosts(all.map((p) => ({ ...p, newComment: "", showComments: false })));
      }
      setTimeout(() => {
        const ref = commentInputRefs.current[postId];
        if (ref && ref.focus) ref.focus();
      }, 50);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/posts/comment/${postId}/${commentId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const updatedComments = await res.json();
      if (Array.isArray(updatedComments)) {
        setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, comments: updatedComments } : p)));
      } else if (updatedComments && updatedComments._id) {
        setPosts((prev) => prev.map((p) => (p._id === postId ? updatedComments : p)));
      } else {
        const all = await fetch("http://localhost:5000/api/posts").then((r) => r.json());
        setPosts(all.map((p) => ({ ...p, newComment: "", showComments: false })));
      }
    } catch (err) {
      console.error(err);
    }
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
    return name
      .toString()
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        {/* Smaller, bold header so it doesn't push layout */}
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
          const liked = user && Array.isArray(post.likes) && post.likes.some((id) => id.toString() === user._id.toString());
          const unliked = user && Array.isArray(post.unlikes) && post.unlikes.some((id) => id.toString() === user._id.toString());

          return (
            <div key={post._id} className="bg-white shadow-md rounded-lg p-4 border border-gray-100">
              {/* Post header */}
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
                      background: "linear-gradient(90deg,#60a5fa,#8b5cf6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 700,
                    }}
                  >
                    {initials(post.user?.username || (post.user?._id || "U"))}
                  </div>
                )}

                <div style={styles.nameBlock}>
                  <p style={styles.nameP}>{post.user?.username || (post.user?._id ? post.user._id.toString().slice(0, 6) : "Unknown")}</p>
                  <small style={styles.nameSmall}>{new Date(post.createdAt).toLocaleString()}</small>
                </div>
              </div>

              {/* Post body */}
              <p className="text-gray-800 mb-3">{post.text}</p>

              {/* Actions */}
              <div className="flex space-x-6 text-sm text-gray-600 border-t pt-2">
                <button
                  onClick={() => handleLike(post._id)}
                  title={liked ? "You liked this" : "Like this post"}
                  className={`${liked ? "text-blue-600 font-bold" : "hover:text-blue-600"}`}
                >
                  👍 Like ({post.likes?.length || 0})
                </button>

                <button
                  onClick={() => handleUnlike(post._id)}
                  title={unliked ? "You unliked this" : "Unlike this post"}
                  className={`${unliked ? "text-red-600 font-bold" : "hover:text-red-600"}`}
                >
                  👎 Unlike ({post.unlikes?.length || 0})
                </button>

                <button onClick={() => toggleComments(post._id)} className="hover:text-blue-600" title="Comment on this post">
                  💬 Comment ({post.comments?.length || 0})
                </button>
              </div>

              {/* Comments area */}
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
                          <div
                            style={{
                              ...styles.commentAvatar,
                              background: "#d1d5db",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {initials(commenterDisplayName(c.user))}
                          </div>
                        )}

                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ lineHeight: 1.05 }}>
                              <p style={{ margin: 0, fontWeight: 600 }}>{commenterDisplayName(c.user)}</p>
                              <small style={{ margin: 0, color: "var(--text)" }}>{new Date(c.createdAt).toLocaleString()}</small>
                            </div>

                            <div style={{ marginLeft: "auto" }}>
                              {isCommentOwner(c.user) && (
                                <button onClick={() => handleDeleteComment(post._id, c._id)} className="text-xs text-red-500 hover:underline">
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>

                          <div style={{ marginTop: 6 }}>
                            <div style={styles.commentBubble}>
                              <p style={{ margin: 0 }} className="text-sm text-gray-800">
                                {c.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 mb-2">No comments yet. Be the first to comment.</p>
                  )}

                  {/* Add comment form */}
                  <form onSubmit={(e) => handleAddComment(e, post._id)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {user?.profilePic ? (
                      <img src={resolveImageUrl(user.profilePic)} alt={user.username || "me"} style={styles.commentAvatar} />
                    ) : (
                      <div
                        style={{
                          ...styles.commentAvatar,
                          background: "linear-gradient(90deg,#10b981,#06b6d4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 700,
                        }}
                      >
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
