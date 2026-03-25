// src/components/ProfilePicUploader.jsx
import { useState } from "react";

export default function ProfilePicUploader({ onUpdated }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const previewStyle = { width: 40, height: 40, borderRadius: "50%", objectFit: "cover" };

  const handleFile = (f) => {
    setFile(f);
    if (!f) { setPreview(null); return; }
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    const fd = new FormData();
    fd.append("profilePic", file);

    try {
      const res = await fetch("http://localhost:5000/api/auth/profile-pic", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (onUpdated) onUpdated(data);
      setFile(null);
      setPreview(null);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-3">
      <label className="flex items-center space-x-2">
        <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} className="hidden" />
        <div className="flex items-center space-x-2 cursor-pointer">
          {preview ? (
            <img src={preview} alt="preview" style={previewStyle} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div style={previewStyle} className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-600">Upload</div>
          )}
          <span className="text-sm text-blue-600 hover:underline">Choose photo</span>
        </div>
      </label>

      <button type="submit" disabled={loading || !file} className="bg-blue-500 text-white px-3 py-1 rounded">
        {loading ? "Uploading..." : "Save"}
      </button>
    </form>
  );
}
