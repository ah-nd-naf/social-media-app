import { useState } from "react";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Signup form submitted:", { username, email, password });

    fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Signup response:", data);

        if (data.message === "User created successfully") {
          alert("Signup successful! You can now log in.");
          // Redirect to login page
          window.location.href = "/login";
        } else {
          alert(data.message || "Signup failed");
        }
      })
      .catch((err) => {
        console.error("Signup error:", err);
        alert("Something went wrong. Please try again.");
      });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow w-80 space-y-4"
      >
        <h2 className="text-xl font-bold">Signup</h2>
        <input
          type="text"
          placeholder="Username"
          className="border p-2 w-full"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded w-full"
        >
          Signup
        </button>
      </form>
    </div>
  );
}

export default Signup;
