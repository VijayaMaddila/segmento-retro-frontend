import { useNavigate } from "react-router-dom";
import "./integrations.css";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Integrations() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("name") || "User";

  function handleLogout() {
    localStorage.clear();
    navigate("/login");
  }

  return (
    <div className="app dashboard-app">
      <header className="dash-navbar">
        <div className="dash-nav-left">
          <span className="dash-logo">SegmentoRetro</span>
        </div>
        <div className="nave-bar">
          <nav className="dash-nav-center">
            <button className="dash-tab" onClick={() => navigate("/retroDashboard")}>
              Dashboard
            </button>
            <button className="dash-tab" onClick={() => navigate("/teams")}>
              Teams
            </button>
            <button className="dash-tab" onClick={() => navigate("/analytics")}>
              Analytics
            </button>
            <button className="dash-tab active">
              Integrations
            </button>
          </nav>
        </div>
        <div className="dash-nav-right">
          <div className="nav-profile">
            <div className="nav-avatar">{getInitials(userName)}</div>
            <span className="nav-username">{userName}</span>
          </div>
          <button className="nav-logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="dash-main">
        <div className="tab-container">
          <div className="tab-header">
            <div>
              <h1 className="page-title">Integrations</h1>
              <p className="page-subtitle">
                Connect SegmentoRetro with your favorite tools
              </p>
            </div>
          </div>

          <div className="integrations-grid">
            {/* Coming Soon Cards */}
            <div className="integration-card disabled">
              <div className="integration-header">
                <div className="integration-icon" style={{ background: "#4A154B" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <path d="M6 15a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2h2v2m1 0a2 2 0 0 1 2-2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2a2 2 0 0 1-2-2v-5m2-8a2 2 0 0 1-2-2a2 2 0 0 1 2-2a2 2 0 0 1 2 2v2H9m0 1a2 2 0 0 1 2 2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2a2 2 0 0 1 2-2h5m8 2a2 2 0 0 1 2-2a2 2 0 0 1 2 2a2 2 0 0 1-2 2h-2v-2m-1 0a2 2 0 0 1-2 2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2a2 2 0 0 1 2 2v5m-2 8a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2v-2h2m0-1a2 2 0 0 1-2-2a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2a2 2 0 0 1-2 2h-5z"/>
                  </svg>
                </div>
                <div className="integration-info">
                  <h3 className="integration-name">Slack</h3>
                  <span className="integration-status">Coming Soon</span>
                </div>
              </div>
              <p className="integration-description">
                Get real-time notifications in Slack when boards are created, cards are added, comments are posted, and votes are cast.
              </p>
            </div>

            <div className="integration-card disabled">
              <div className="integration-header">
                <div className="integration-icon" style={{ background: "#0052CC" }}>
                  <span style={{ fontSize: "20px" }}>J</span>
                </div>
                <div className="integration-info">
                  <h3 className="integration-name">Jira</h3>
                  <span className="integration-status">Coming Soon</span>
                </div>
              </div>
              <p className="integration-description">
                Sync retrospective action items with Jira issues automatically.
              </p>
            </div>

            <div className="integration-card disabled">
              <div className="integration-header">
                <div className="integration-icon" style={{ background: "#6264A7" }}>
                  <span style={{ fontSize: "20px" }}>T</span>
                </div>
                <div className="integration-info">
                  <h3 className="integration-name">Microsoft Teams</h3>
                  <span className="integration-status">Coming Soon</span>
                </div>
              </div>
              <p className="integration-description">
                Get notifications in Microsoft Teams channels.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Integrations;
