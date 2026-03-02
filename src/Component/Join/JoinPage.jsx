import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./join.css";

export default function JoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setMessage("Invalid invitation link.");
      setStatus("error");
    }
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    setSubmitting(true);
    setStatus("loading");
    setMessage("Joining team...");

    try {
      const params = new URLSearchParams({
        token: token,
        name: name.trim()
      });
      
      if (email.trim()) {
        params.append("email", email.trim());
      }
      
      console.log("Accepting invitation with params:", params.toString());
      
      const res = await fetch(
        `http://localhost:8080/api/teams/accept-invite?${params.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response status:", res.status);

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Access forbidden. The invitation link may have expired or is invalid. Please contact your team administrator.");
        }
        const errorText = await res.text().catch(() => "");
        console.error("Error response:", errorText);
        throw new Error(errorText || "Failed to accept invitation");
      }

      // Try to parse response as JSON (for existing users)
      const contentType = res.headers.get("content-type");
      let responseData = null;
      
      if (contentType && contentType.includes("application/json")) {
        responseData = await res.json().catch(() => null);
        console.log("Join response data:", responseData);
      } else {
        const responseText = await res.text().catch(() => "");
        console.log("Join successful (text):", responseText);
      }

      // Check if user already existed and we got login credentials
      if (responseData && responseData.userExists && responseData.token) {
        // User already exists - log them in automatically
        console.log("Existing user detected, logging in automatically");
        
        localStorage.setItem("token", responseData.token);
        localStorage.setItem("userId", String(responseData.userId));
        localStorage.setItem("name", responseData.name || name.trim());
        
        if (responseData.role) {
          localStorage.setItem("role", responseData.role);
        }

        setStatus("success");
        setMessage("Welcome back! You've been added to the team. Redirecting to dashboard...");

        setTimeout(() => {
          navigate("/retroDashboard");
        }, 1500);
      } else {
        // New user created - redirect to login
        setStatus("success");
        setMessage("Welcome to the team! You can now log in or register to set up your account.");

        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (err) {
      console.error("Error accepting invitation:", err);
      setStatus("error");
      setMessage(err.message || "Failed to join the team. The invitation link may be expired or invalid.");
      setSubmitting(false);
    }
  }

  if (status === "error" && !token) {
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
          <h2 className="join-title">You've been invited to join a team!</h2>
          <p className="join-subtitle">Enter your details to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="join-form">
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
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address (Optional)
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="Enter your email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-join" disabled={submitting}>
            {submitting ? "Joining..." : "Join Team"}
          </button>
        </form>
      </div>
    </div>
  );
}
