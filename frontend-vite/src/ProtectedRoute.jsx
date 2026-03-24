import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    // If no token, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If token exists, show the protected page
  return children;
}

export default ProtectedRoute;
