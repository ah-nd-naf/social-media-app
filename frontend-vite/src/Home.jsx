import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Fetch user info
    fetch("http://localhost:5000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => console.error("Error fetching user:", err));

    // Fetch posts
    fetch("http://localhost:5000/api/posts")
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error("Error fetching posts:", err));
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/posts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error("Failed to create post");
      }

      const newPost = await res.json();
      setPosts([newPost, ...posts]);
      setText("");
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Could not create post. Please try again.");
    }
  };

  // Logout with confirmation
  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  // ✅ Handle Like toggle
  const handleLike = async (postId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/posts/like/${postId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to like post");
      const updatedPost = await res.json();
      setPosts(posts.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  // ✅ Handle Unlike toggle
  const handleUnlike = async (postId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/posts/unlike/${postId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to unlike post");
      const updatedPost = await res.json();
      setPosts(posts.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
    } catch (err) {
      console.error("Error unliking post:", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header with welcome + logout aligned */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {user ? `Welcome, ${user.username}!` : "Loading..."}
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
        >
          Logout
        </button>
      </div>

      {/* Post form */}
      <form
        onSubmit={handleCreatePost}
        className="bg-white shadow-md rounded-lg p-4 mb-6"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3 resize-none"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold"
        >
          Share
        </button>
      </form>

      {/* Posts list */}
      <h2 className="text-xl font-semibold mb-4">Recent Posts</h2>
      <div className="space-y-4">
        {posts.map((post) => {
          // ✅ Use .some() with toString() to avoid ObjectId vs string mismatch
          const liked =
            user &&
            post.likes?.some((id) => id.toString() === user._id.toString());
          const unliked =
            user &&
            post.unlikes?.some((id) => id.toString() === user._id.toString());

          return (
            <div
              key={post._id}
              className="bg-white shadow-md rounded-lg p-4 border border-gray-100"
            >
              {/* User info */}
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center font-bold text-white">
                  {post.user?.username
                    ? post.user.username.slice(0, 2).toUpperCase()
                    : "?"}
                </div>
                <div className="ml-3">
                  <p className="font-semibold">
                    {post.user?.username || "Unknown User"}
                  </p>
                  <small className="text-gray-500">
                    {new Date(post.createdAt).toLocaleString()}
                  </small>
                </div>
              </div>

              {/* Post content */}
              <p className="text-gray-800 mb-3">{post.text}</p>

              {/* Actions */}
              <div className="flex space-x-6 text-sm text-gray-600 border-t pt-2">
                <button
                  onClick={() => handleLike(post._id)}
                  title={liked ? "You liked this" : "Like this post"}
                  className={`${
                    liked ? "text-blue-600 font-bold" : "hover:text-blue-600"
                  }`}
                >
                  👍 Like ({post.likes?.length || 0})
                </button>
                <button
                  onClick={() => handleUnlike(post._id)}
                  title={unliked ? "You unliked this" : "Unlike this post"}
                  className={`${
                    unliked ? "text-red-600 font-bold" : "hover:text-red-600"
                  }`}
                >
                  👎 Unlike ({post.unlikes?.length || 0})
                </button>
                <button
                  className="hover:text-blue-600"
                  title="Comment on this post"
                >
                  💬 Comment ({post.comments?.length || 0})
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Home;
