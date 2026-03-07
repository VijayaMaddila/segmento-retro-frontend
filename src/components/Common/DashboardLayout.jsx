import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown";
import { useClickOutside } from "../../hooks";
import "../Dashboard/dashboard.css";

const NAV_TABS = [
  { id: "dashboard", label: "Dashboard", path: "/retroDashboard" },
  { id: "teams", label: "Teams", path: "/teams" },
  { id: "analytics", label: "Analytics", path: "/analytics" },
  { id: "integrations", label: "Integrations", path: "/integrations" },
];

/**
 * Shared layout for Dashboard pages (Analytics, Teams, Integrations).
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.title - Page title
 * @param {string} [props.subtitle] - Page subtitle
 * @param {string} props.activeTab - "dashboard" | "teams" | "analytics" | "integrations"
 * @param {React.ReactNode} [props.headerActions] - Optional actions (e.g. search, create button)
 */
export default function DashboardLayout({
  children,
  title,
  subtitle,
  activeTab,
  headerActions,
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  function handleNav(path) {
    navigate(path);
    setMenuOpen(false);
  }

  return (
    <div className="app dashboard-app">
      <div ref={menuRef}>
        <header className="dash-navbar">
          <div className="dash-nav-left">
            <button
              type="button"
              className={`nav-hamburger${menuOpen ? " open" : ""}`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle navigation menu"
            >
              <span />
              <span />
              <span />
            </button>
            <span className="dash-logo">SegmentoRetro</span>
          </div>
          <div className="nave-bar">
            <nav className="dash-nav-center">
              {NAV_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`dash-tab ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => handleNav(tab.path)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <ProfileDropdown />
        </header>

        <nav className={`dash-mobile-menu${menuOpen ? " open" : ""}`}>
          {NAV_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`dash-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => handleNav(tab.path)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="dash-main">
        <div className="tab-container">
          <div className="tab-header">
            <div>
              <h1 className="page-title">{title}</h1>
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {headerActions}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
