import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import teamService from "../../api/services/teamService";
import "./join.css";

export default function JoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("loading");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [userName, setUserName] = useState("");

  const token = searchParams.get("token");
  const emailFromUrl = searchParams.get("email");

  useEffect(() => {
    if (!token || !emailFromUrl) {
      setMessage("Invalid invitation link. Missing token or email.");
      setStatus("error");
      return;
    }

    setEmail(emailFromUrl);
    checkUserStatus();
  }, [token, emailFromUrl]);

  async function checkUserStatus() {
    try {
      const response = await teamService.checkUser(emailFromUrl);
      
      if (response.ok && response.data) {
        setIsExistingUser(response.data.exists);
        if (response.data.exists && response.data.name) {
          setUserName(response.data.name);
        }
        setStatus("form");
      } else {
        setStatus("form");
      }
    } catch (err) {
      console.error("Error checking user status:", err);
      setStatus("form");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    
    // Validation for new users
    if (!isExistingUser) {
      if (!name.trim()) {
        setError("Please enter your name");
        return;
      }

      if (!password) {
        setError("Please enter a password");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    setSubmitting(true);
    setStatus("loading");
    setMessage("Joining team...");

    try {
      const requestBody = {
        token: token,
      };

      // Add fields based on user type
      if (isExistingUser) {
        // Existing user - only send token
      } else {
        // New user - send name, email, and password
        requestBody.name = name.trim();
        requestBody.email = email;
        requestBody.password = password;
      }
      
      console.log("Accepting invitation with body:", { ...requestBody, password: requestBody.password ? '***' : undefined });
      
      const response = await teamService.acceptInvite(requestBody);

      if (!response.ok) {
        throw new Error(response.message || response.error || "Failed to accept invitation");
      }

      const responseData = response.data;
      console.log("Join response data:", responseData);

      // Store authentication data
      if (responseData.token) {
        localStorage.setItem("authToken", responseData.token);
        localStorage.setItem("token", responseData.token); // Keep for backward compatibility
      }
      
      if (responseData.userId) {
        localStorage.setItem("userId", String(responseData.userId));
      }
      
      if (responseData.name) {
        localStorage.setItem("userName", responseData.name);
        localStorage.setItem("name", responseData.name); // Keep for backward compatibility
      }
      
      if (responseData.email) {
        localStorage.setItem("userEmail", responseData.email);
      }

      // Show success message
      setStatus("success");
      if (responseData.userExists || isExistingUser) {
        setMessage(`Welcome back${userName ? ', ' + userName : ''}! You've been added to the team. Redirecting to dashboard...`);
      } else {
        setMessage("Account created successfully! Welcome to the team. Redirecting to dashboard...");
      }

      setTimeout(() => {
        navigate("/retroDashboard");
      }, 1500);
    } catch (err) {
      console.error("Error accepting invitation:", err);
      setStatus("error");
      setMessage(err.message || "Failed to join the team. The invitation link may be expired or invalid.");
      setSubmitting(false);
    }
  }

  if (status === "error" && (!token || !emailFromUrl)) {
    return (
      <div className="join-container">
        <div className="join-card">
          <div className="join-icon join-icon--error">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#e53935" strokeWidth="2" />
              <path d="M8 8l8 8M16 8l-8 8" stroke="#e53935" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="join-title">{message}</h2>
          <button className="btn-back-home" onClick={() => navigate("/")}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="join-container">
        <div className="join-card">
          <div className="join-icon join-icon--loading">
            <div className="spinner-large"></div>
          </div>
          <h2 className="join-title">{message}</h2>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="join-container">
        <div className="join-card">
          <div className="join-icon join-icon--success">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#4caf50" strokeWidth="2" />
              <path d="M8 12l2 2 4-4" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="join-title">{message}</h2>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="join-container">
        <div className="join-card">
          <div className="join-icon join-icon--error">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#e53935" strokeWidth="2" />
              <path d="M8 8l8 8M16 8l-8 8" stroke="#e53935" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="join-title">{message}</h2>
          <button className="btn-back-home" onClick={() => navigate("/")}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="join-container">
      <div className="join-card">
        <div className="join-header">
          <h1 className="join-logo">SegmentoRetro</h1>
          <h2 className="join-title">
            {isExistingUser ? "Welcome back!" : "You've been invited to join a team!"}
          </h2>
          <p className="join-subtitle">
            {isExistingUser 
              ? `Hi ${userName || 'there'}! Click below to join the team.` 
              : "Create your account to get started"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="join-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              disabled
            />
          </div>

          {!isExistingUser && (
            <>
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="Enter password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-input"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </>
          )}

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-join" disabled={submitting}>
            {submitting 
              ? "Processing..." 
              : isExistingUser 
                ? "Join Team & Continue" 
                : "Create Account & Join Team"}
          </button>
        </form>
      </div>
    </div>
  );
}
