import { useEffect, useState } from "react";
import ProfilePicUploader from "../components/ProfilePicUploader";

export default function Profile({ initialUser, onUserUpdate }) {
  const [user, setUser] = useState(initialUser || null);

  useEffect(() => {
    if (!user) {
      const token = localStorage.getItem("token");
      if (!token) return;
      fetch("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => setUser(data))
        .catch((err) => console.error(err));
    }
  }, []);

  const handleUpdated = (updatedUser) => {
    setUser(updatedUser);
    if (onUserUpdate) onUserUpdate(updatedUser);
  };

  const resolveImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `http://localhost:5000${path}`;
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Profile</h2>

      <div className="flex items-center space-x-4 mb-4">
        {user?.profilePic ? (
          <img
            src={resolveImageUrl(user.profilePic)}
            alt={user.username}
            className="w-24 h-24 rounded-full object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-xl font-bold">
            {user?.username?.slice(0, 2).toUpperCase() || "U"}
          </div>
        )}

        <div>
          <p className="font-semibold">{user?.username}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      <ProfilePicUploader onUpdated={handleUpdated} />
    </div>
  );
}
