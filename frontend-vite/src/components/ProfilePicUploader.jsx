import { useState } from "react";

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
      alert("No auth token found. Please log in again.");
      setLoading(false);
      return;
    }

    const fd = new FormData();
    fd.append("profilePic", file); // must match backend

    try {
      const res = await fetch("http://localhost:5000/api/users/upload-pic", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Upload failed");
      }

      const data = await res.json();
      if (onUpdated) onUpdated(data);

      setFile(null);
      setPreview(null);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-6 mt-6">
      <label className="cursor-pointer flex items-center gap-3">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files[0])}
          className="hidden"
        />
        {preview ? (
          <img
            src={preview}
            alt="preview"
            className="w-24 h-24 rounded-full object-cover border border-gray-300 shadow-md"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-600">
            Upload
          </div>
        )}
        <span className="text-sm text-blue-600 hover:underline">Choose photo</span>
      </label>

      <button
        type="submit"
        disabled={loading || !file}
        className={`px-5 py-2 rounded-lg font-semibold transition ${
          loading || !file
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {loading ? "Uploading..." : "Save"}
      </button>
    </form>
  );
}
