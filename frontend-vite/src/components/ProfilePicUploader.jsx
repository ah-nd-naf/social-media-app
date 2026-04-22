import { useState } from "react";
import { Upload, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePicUploader({ onUpdated }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (f) => {
    setFile(f);
    if (!f) {
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    const fd = new FormData();
    fd.append("profilePic", file);

    try {
      const res = await fetch("https://social-media-app-6wbl.onrender.com/api/users/upload-pic", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      if (onUpdated) onUpdated(data);

      setFile(null);
      setPreview(null);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-6">
        <label className="relative group cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files[0])}
            className="hidden"
          />
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 group-hover:border-purple-500/50 flex items-center justify-center transition-all overflow-hidden bg-white/5">
            {preview ? (
              <img
                src={preview}
                alt="preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <Upload className="text-slate-500 group-hover:text-purple-400 transition-colors" size={24} />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1.5 shadow-lg border-2 border-slate-900 group-hover:scale-110 transition-transform">
            <Upload size={12} className="text-white" />
          </div>
        </label>

        <AnimatePresence>
          {file && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3"
            >
              <button
                type="submit"
                disabled={loading}
                className="btn-primary p-2 rounded-xl"
                title="Save Photo"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={20} />
                )}
              </button>
              <button
                type="button"
                onClick={() => { setFile(null); setPreview(null); }}
                className="btn-secondary p-2 rounded-xl text-red-400 hover:text-red-300"
                title="Cancel"
              >
                <X size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!file && (
          <div className="text-sm">
            <p className="text-slate-200 font-medium">Change Photo</p>
            <p className="text-slate-500">JPG, PNG or GIF. Max 5MB</p>
          </div>
        )}
      </form>
    </div>
  );
}

