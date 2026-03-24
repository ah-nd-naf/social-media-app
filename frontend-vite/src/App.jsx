import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";
import Home from "./Home";
import ProtectedRoute from "./ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
