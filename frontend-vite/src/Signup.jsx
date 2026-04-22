import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, User, AlertCircle, Rocket } from "lucide-react";

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

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!res.ok) {
        setError(data.message || `Signup failed (status ${res.status})`);
      } else {
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
    <div className="min-h-screen bg-[#050508] flex flex-col justify-center items-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 mb-4 border border-cyan-500/20">
            <Rocket size={32} />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Create Account</h2>
          <p className="text-slate-400 mt-2">Join our community today</p>
        </div>

        <div className="glass-card p-8 rounded-3xl border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="johndoe"
                  className="w-full bg-[#11121d] border border-white/10 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-white"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full bg-[#11121d] border border-white/10 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-[#11121d] border border-white/10 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-xl text-sm border border-red-400/20">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all text-white"
              style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>Sign Up</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/5 pt-6">
            <p className="text-slate-400 text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Signup;



