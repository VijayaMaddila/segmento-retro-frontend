import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './Component/Register/Register';
import Dashboard from './Component/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Redirect root to login/register combined page */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Combined login/register UI */}
        <Route path="/login" element={<Register />} />
        <Route path="/register" element={<Register />} />

        {/* Post-login dashboard */}
        <Route path="/retroDashboard" element={<Dashboard />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;