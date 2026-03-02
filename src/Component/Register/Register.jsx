import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import "./register.css";

function Register() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/retroDashboard", { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const isLogin = mode === "login";
      const response = await fetch(
        isLogin
          ? "http://localhost:8080/api/auth/login"
          : "http://localhost:8080/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isLogin ? { email, password } : { name, email, password, role },
          ),
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.message ||
            (isLogin ? "Invalid email or password" : "Registration failed"),
        );
      }

      if (isLogin) {
        if (!data.token) {
          throw new Error("Token not received from server");
        }
        localStorage.setItem("token", data.token);

        try {
          const parts = data.token.split(".");
          if (parts.length === 3) {
            const payloadBase64 = parts[1]
              .replace(/-/g, "+")
              .replace(/_/g, "/");
            const payloadJson = atob(payloadBase64);
            const payload = JSON.parse(payloadJson);

            const userIdFromToken = payload.id;
            if (userIdFromToken !== undefined && userIdFromToken !== null) {
              localStorage.setItem("userId", String(userIdFromToken));
            }

            if (payload.name) {
              localStorage.setItem("name", payload.name);
            }

            if (payload.role) {
              localStorage.setItem("role", payload.role);
            }
          }
        } catch (e) {
          console.error("Failed to decode JWT payload", e);
        }

        navigate("/retroDashboard");
      } else {
        setMode("login");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app auth-app">
      <main className="auth-main">
        <div className="auth-card">
          <h1>{mode === "register" ? "Create account" : "Log in"}</h1>
          <p className="auth-subtitle">
            {mode === "register"
              ? "Sign up in a few seconds and start running better retrospectives."
              : "Welcome back. Log in to run your next retrospective."}
          </p>

          <div className="auth-toggle">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
              disabled={loading}
            >
              Log in
            </button>
            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => setMode("register")}
              disabled={loading}
            >
              Register
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "register" && (
              <>
                <label className="auth-field">
                  <span>Name</span>
                  <div className="input-with-icon">
                    <span className="input-icon" aria-hidden="true">
                      <FiUser />
                    </span>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                    />
                  </div>
                </label>
              </>
            )}

            <label className="auth-field">
              <span>Email</span>
              <div className="input-with-icon">
                <span className="input-icon" aria-hidden="true">
                  <FiMail />
                </span>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Password</span>
              <div className="password-field input-with-icon">
                <span className="input-icon" aria-hidden="true">
                  <FiLock />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                  <span className="visually-hidden">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </button>
              </div>
            </label>

            {mode === "register" && (
              <label className="auth-field">
                <span>Role</span>
                <select
                  className="field-input"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: "14px",
                    border: "1px solid #e0e4ea",
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </label>
            )}

            {error ? <p className="auth-error">{error}</p> : null}

            <button
              className="btn btn-primary btn-lg auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? mode === "register"
                  ? "Creating account…"
                  : "Logging in..."
                : mode === "register"
                  ? "Create account"
                  : "Log in"}
            </button>
          </form>

          <p className="auth-footer-text">
            {mode === "register" ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setMode("login")}
                  disabled={loading}
                >
                  Log in
                </button>
              </>
            ) : (
              <>
                Don’t have an account?{" "}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setMode("register")}
                  disabled={loading}
                >
                  Create one
                </button>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}

export default Register;
