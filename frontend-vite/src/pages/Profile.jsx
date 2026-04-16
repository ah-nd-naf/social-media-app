import { useEffect, useState } from "react";
import ProfilePicUploader from "../components/ProfilePicUploader";

export default function Profile({ initialUser, onUserUpdate }) {
  const [user, setUser] = useState(initialUser || null);
  const [username, setUsername] = useState(initialUser?.username || "");
  const [bio, setBio] = useState(initialUser?.bio || "");

  useEffect(() => {
    if (!user) {
      const token = localStorage.getItem("token");
      if (!token) return;
      fetch("http://localhost:5000/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          setUser(data);
          setUsername(data.username || "");
          setBio(data.bio || "");
        })
        .catch((err) => console.error(err));
    }
  }, []);

  const handleUpdated = (updatedUser) => {
    setUser(updatedUser);
    if (onUserUpdate) onUserUpdate(updatedUser);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/users/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username, bio }),
    });
    const updated = await res.json();
    handleUpdated(updated);
  };

  const resolveImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `https://social-media-app-6wbl.onrender.com${path}`;
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
      {/* Header */}
      <div className="flex items-center gap-6 mb-8">
        {user?.profilePic ? (
          <img
            src={resolveImageUrl(user.profilePic)}
            alt={user.username}
            className="w-28 h-28 rounded-full object-cover border border-gray-300 shadow-md"
          />
        ) : (
          <div className="w-28 h-28 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold">
            {user?.username?.slice(0, 2).toUpperCase() || "U"}
          </div>
        )}

        <div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {user?.username}
          </h3>
          <p className="text-gray-500">{user?.email}</p>
          {user?.bio && (
            <p className="mt-2 text-gray-700 dark:text-gray-300 italic">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      {/* Avatar uploader */}
      <ProfilePicUploader onUpdated={handleUpdated} />

      {/* Form */}
      <form onSubmit={handleProfileUpdate} className="space-y-6 mt-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Username
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
