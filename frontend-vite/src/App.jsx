import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";
import Home from "./Home";
import ProtectedRoute from "./ProtectedRoute";
import Profile from "./pages/Profile";

function App() {
  const [user, setUser] = useState(null);

  // Fetch current user once on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("http://localhost:5000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Not authenticated");
        return r.json();
      })
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home user={user} setUser={setUser} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={<Profile initialUser={user} onUserUpdate={setUser} />}
      />
    </Routes>
  );
}

export default App;
