function Home() {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-r from-blue-100 to-blue-200">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">
          Welcome, you are logged in!
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          This is your Home page. You can now add posts, view your feed, or explore features.
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
