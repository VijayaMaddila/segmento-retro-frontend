import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./Component/Landing/Landing";
import Register from "./Component/Register/Register";
import Dashboard from "./Component/Dashboard/Dashboard";
import Board from "./Component/Board/Board";
import Analytics from "./Component/Analytics/Analytics";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Register />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/retroDashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/board/:boardId"
          element={
            <ProtectedRoute>
              <Board />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
