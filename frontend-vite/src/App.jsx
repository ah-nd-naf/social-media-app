import { useEffect, useState } from "react";

function App() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/posts")
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(err => console.error("Error fetching posts:", err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Posts</h1>
      <ul className="space-y-4">
        {posts.map(post => (
          <li key={post._id} className="p-4 bg-gray-100 rounded shadow">
            <p className="font-semibold">{post.user.username}</p>
            <p>{post.text}</p>
            {post.image && (
              <img
                src={post.image}
                alt="Post"
                className="mt-2 rounded max-w-sm"
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
