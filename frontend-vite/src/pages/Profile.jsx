import { useEffect, useState } from "react";
import ProfilePicUploader from "../components/ProfilePicUploader";
import { motion } from "framer-motion";
import { User, Mail, FileText, Save, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Profile({ initialUser, onUserUpdate }) {
  const [user, setUser] = useState(initialUser || null);
  const [username, setUsername] = useState(initialUser?.username || "");
  const [bio, setBio] = useState(initialUser?.bio || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      const token = localStorage.getItem("token");
      if (!token) return;
      fetch("https://social-media-app-6wbl.onrender.com/api/users/me", {
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
    setIsSaving(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("https://social-media-app-6wbl.onrender.com/api/users/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, bio }),
      });
      const updated = await res.json();
      handleUpdated(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const resolveImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `https://social-media-app-6wbl.onrender.com${path}`;
  };

  return (
    <div className="min-h-screen p-6">
      <main className="max-w-2xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
          <span>Back to Feed</span>
        </Link>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500" />
          
          <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-purple-500 to-cyan-500">
                {user?.profilePic ? (
                  <img
                    src={resolveImageUrl(user.profilePic)}
                    alt={user.username}
                    className="w-full h-full rounded-full object-cover border-4 border-slate-900"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-3xl font-bold border-4 border-slate-900">
                    {user?.username?.slice(0, 2).toUpperCase() || "U"}
                  </div>
                )}
              </div>
            </div>

            <div className="text-center md:text-left space-y-2">
              <h3 className="text-3xl font-bold text-white">
                {user?.username}
              </h3>
              <div className="flex items-center gap-2 text-slate-400 justify-center md:justify-start">
                <Mail size={16} />
                <span>{user?.email}</span>
              </div>
              {user?.bio && (
                <p className="text-slate-300 italic max-w-md">
                  "{user.bio}"
                </p>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="pt-6 border-t border-white/5">
              <h4 className="text-lg font-semibold text-white mb-4">Profile Photo</h4>
              <ProfilePicUploader onUpdated={handleUpdated} />
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-6 pt-6 border-t border-white/5">
              <h4 className="text-lg font-semibold text-white mb-4">Account Details</h4>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Username</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Bio</label>
                <div className="relative group">
                  <FileText className="absolute left-4 top-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-white resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={20} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

