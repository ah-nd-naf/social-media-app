import { useEffect, useState } from "react";

function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch("http://localhost:5000/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`, // matches updated middleware
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      })
      .then((data) => setUser(data))
      .catch((err) => {
        console.error(err);
        localStorage.removeItem("token");
        window.location.href = "/login";
      });
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-r from-blue-100 to-blue-200">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">
          {user ? `Welcome, ${user.username}!` : "Loading..."}
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          {user ? `Your email: ${user.email}` : ""}
        </p>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Home;
