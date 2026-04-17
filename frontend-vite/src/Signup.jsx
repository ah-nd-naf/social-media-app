import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("https://social-media-app-6wbl.onrender.com/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      // Safely parse JSON
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!res.ok) {
        // Show backend error message if available
        setError(data.message || `Signup failed (status ${res.status})`);
      } else {
        alert("Signup successful! Please log in.");
        navigate("/login");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-96 space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800">Sign Up</h2>

        <input
          type="text"
          placeholder="Username"
          className="border rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          className="border rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="border rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg w-full transition duration-200 disabled:opacity-50"
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        <p className="text-sm text-center text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-green-500 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Signup;
