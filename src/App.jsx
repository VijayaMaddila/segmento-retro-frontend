import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./routes";
import Landing from "./components/Landing/Landing";
import Register from "./components/Register/Register";
import Dashboard from "./components/Dashboard/Dashboard";
import Board from "./components/Board/Board";
import Analytics from "./components/Analytics/Analytics";
import Teams from "./components/Teams/Teams";
import Integrations from "./components/Integrations/Integrations";
import JoinPage from "./components/Join/JoinPage";
import MagicLogin from "./components/MagicLogin/MagicLogin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Register />} />
        <Route path="/register" element={<Register />} />
        <Route path="/magic-login" element={<MagicLogin />} />
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
        <Route
          path="/teams"
          element={
            <ProtectedRoute>
              <Teams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/integrations"
          element={
            <ProtectedRoute>
              <Integrations />
            </ProtectedRoute>
          }
        />

        <Route path="/join" element={<JoinPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
