import { Navigate } from "react-router-dom";

/**
 * Wraps route content; redirects to /login if user is not authenticated.
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}
