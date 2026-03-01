import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiTrash2, FiUsers, FiX, FiSearch } from "react-icons/fi";
import "./dashboard.css";

// ─── Shared helpers ───────────────────────────────────────────────────────────
function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function formatDate(str) {
  if (!str) return null;
  try {
    return new Date(str).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

const PALETTE = [
  { bg: "#e8f4fd", accent: "#2196f3" },
  { bg: "#fef3e2", accent: "#ff9800" },
  { bg: "#eafaf1", accent: "#4caf50" },
  { bg: "#fdf2f8", accent: "#e91e63" },
  { bg: "#f0f4ff", accent: "#5c6bc0" },
  { bg: "#fff8e1", accent: "#ffc107" },
  { bg: "#fce4ec", accent: "#e53935" },
  { bg: "#e8eaf6", accent: "#3f51b5" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CREATE TEMPLATE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function CreateTemplateModal({ onClose, onCreated }) {
  const [templateName, setTemplateName] = useState("");
  const [columns, setColumns] = useState([
    { uid: 1, name: "" },
    { uid: 2, name: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addColumn() {
    setColumns((p) => [...p, { uid: Date.now() + Math.random(), name: "" }]);
  }
  function removeColumn(uid) {
    if (columns.length <= 1) return;
    setColumns((p) => p.filter((c) => c.uid !== uid));
  }
  function updateColumn(uid, value) {
    setColumns((p) =>
      p.map((c) => (c.uid === uid ? { ...c, name: value } : c)),
    );
  }

  async function handleSave() {
    setError("");
    if (!templateName.trim()) return setError("Please enter a template name.");
    const filled = columns.filter((c) => c.name.trim());
    if (!filled.length) return setError("Please add at least one column.");
    setSaving(true);
    try {
      const res = await fetch("http://localhost:8080/api/templates", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title: templateName.trim(),
          columns: filled.map((c, i) => ({
            name: c.name.trim(),
            position: i + 1,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to create template");
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 className="modal-title">Create Custom Template</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="modal-body">
          <label className="field-group">
            <span className="field-label">Template Name</span>
            <input
              className="field-input"
              type="text"
              placeholder="e.g. Sprint Retro, Team Health..."
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              autoFocus
            />
          </label>

          <div className="field-group">
            <span className="field-label">Columns</span>
            <div className="tpl-columns-list">
              {columns.map((col, idx) => (
                <div key={col.uid} className="tpl-column-row">
                  <span className="tpl-column-index">{idx + 1}</span>
                  <input
                    className="field-input tpl-column-input"
                    type="text"
                    placeholder={`Column ${idx + 1} name`}
                    value={col.name}
                    onChange={(e) => updateColumn(col.uid, e.target.value)}
                  />
                  <button
                    className="icon-btn icon-btn--danger"
                    onClick={() => removeColumn(col.uid)}
                    disabled={columns.length <= 1}
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <button
              className="link-btn"
              style={{ marginTop: 6 }}
              onClick={addColumn}
            >
              <FiPlus
                size={12}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Add column
            </button>
          </div>

          {error && <p className="field-error">{error}</p>}
          <footer className="modal-footer">
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Creating…" : "Create Template"}
            </button>
            <button
              className="btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE TEAM MODAL
// ─────────────────────────────────────────────────────────────────────────────
function CreateTeamModal({ onClose, onCreated }) {
  const [teamName, setTeamName] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoadingUsers(true);
    fetch("http://localhost:8080/api/users", { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setAllUsers(Array.isArray(d) ? d : []))
      .catch(() => setAllUsers([]))
      .finally(() => setLoadingUsers(false));
  }, []);

  const filteredUsers = allUsers.filter(
    (u) =>
      !selectedMembers.find((m) => m.id === u.id) &&
      (!memberSearch ||
        u.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(memberSearch.toLowerCase())),
  );

  function addMember(user) {
    setSelectedMembers((p) => [...p, user]);
    setMemberSearch("");
  }
  function removeMember(id) {
    setSelectedMembers((p) => p.filter((m) => m.id !== id));
  }

  async function handleSave() {
    setError("");
    if (!teamName.trim()) return setError("Please enter a team name.");
    setSaving(true);
    try {
      const userId = localStorage.getItem("userId");
      const res = await fetch("http://localhost:8080/api/teams/create", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: teamName.trim(),
          createdBy: userId ? Number(userId) : null,
          members: selectedMembers.map((m) => m.id),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to create team");
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 className="modal-title">Create Team</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="modal-body">
          {/* Team Name */}
          <label className="field-group">
            <span className="field-label">Team Name</span>
            <input
              className="field-input"
              type="text"
              placeholder="e.g. Frontend Squad, Design Team..."
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              autoFocus
            />
          </label>

          {/* Members */}
          <div className="field-group">
            <span className="field-label">
              Add Members
              {allUsers.length > 0 && (
                <span className="badge-muted">
                  {allUsers.length} users available
                </span>
              )}
            </span>

            {/* Search bar */}
            <div className="search-wrap">
              <FiSearch size={14} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by name or email..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
              {memberSearch && (
                <button
                  className="search-clear"
                  type="button"
                  onClick={() => setMemberSearch("")}
                >
                  <FiX size={12} />
                </button>
              )}
            </div>

            {/* Scrollable user list — always visible */}
            <div className="user-list">
              {loadingUsers ? (
                <div className="user-list-empty">
                  <span className="spinner spinner--sm" />
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="user-list-empty">
                  {memberSearch
                    ? `No users match "${memberSearch}"`
                    : "No users available"}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="user-list-item"
                    onClick={() => addMember(user)}
                  >
                    <span className="user-avatar">
                      {getInitials(user.name)}
                    </span>
                    <span className="user-info">
                      <span className="user-name">{user.name}</span>
                      {user.email && (
                        <span className="user-email">{user.email}</span>
                      )}
                    </span>
                    <span className="user-add-btn">+</span>
                  </button>
                ))
              )}
            </div>

            {/* Selected member chips */}
            {selectedMembers.length > 0 && (
              <div className="selected-members">
                <span className="selected-label">
                  Selected ({selectedMembers.length})
                </span>
                <div className="chip-wrap">
                  {selectedMembers.map((m) => (
                    <div key={m.id} className="member-chip">
                      <span className="chip-avatar">{getInitials(m.name)}</span>
                      <span className="chip-name">{m.name || m.email}</span>
                      <button
                        type="button"
                        className="chip-remove"
                        onClick={() => removeMember(m.id)}
                      >
                        <FiX size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && <p className="field-error">{error}</p>}
          <footer className="modal-footer">
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Creating…" : "Create Team"}
            </button>
            <button
              className="btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED CARD COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function BoardCard({ board, onClick }) {
  const { bg, accent } = PALETTE[board.id % PALETTE.length];
  return (
    <div
      className="dash-card"
      style={{ background: bg, cursor: "pointer" }}
      onClick={onClick}
    >
      <div className="dash-card-accent" style={{ background: accent }} />
      <div className="dash-card-body">
        <div className="dash-card-avatar" style={{ background: accent }}>
          {getInitials(board.title)}
        </div>
        <div className="dash-card-info">
          <h3 className="dash-card-title">{board.title}</h3>
          {board.teamName && (
            <span className="dash-card-meta" style={{ color: accent }}>
              <FiUsers
                size={11}
                style={{ marginRight: 3, verticalAlign: "middle" }}
              />
              {board.teamName}
            </span>
          )}
          {!board.teamName && board.templateName && (
            <span className="dash-card-meta" style={{ color: accent }}>
              {board.templateName}
            </span>
          )}
        </div>
      </div>
      {formatDate(board.createdAt) && (
        <div className="dash-card-date">{formatDate(board.createdAt)}</div>
      )}
    </div>
  );
}

function TeamCard({ team, idx }) {
  const { bg, accent } = PALETTE[idx % PALETTE.length];
  const memberCount = team.members?.length || 0;
  return (
    <div className="dash-card" style={{ background: bg }}>
      <div className="dash-card-accent" style={{ background: accent }} />
      <div className="dash-card-body">
        <div className="dash-card-avatar" style={{ background: accent }}>
          {getInitials(team.name)}
        </div>
        <div className="dash-card-info">
          <h3 className="dash-card-title">{team.name}</h3>
          <span className="dash-card-meta" style={{ color: accent }}>
            <FiUsers
              size={11}
              style={{ marginRight: 3, verticalAlign: "middle" }}
            />
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </span>
        </div>
      </div>
      {team.members?.length > 0 && (
        <div className="mini-avatars">
          {team.members.slice(0, 4).map((m, mi) => (
            <div
              key={mi}
              className="mini-avatar"
              style={{ background: PALETTE[(mi + 2) % PALETTE.length].accent }}
              title={m.name || `Member ${mi + 1}`}
            >
              {getInitials(m.name || String(m))}
            </div>
          ))}
          {team.members.length > 4 && (
            <div className="mini-avatar mini-avatar--more">
              +{team.members.length - 4}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEAMS TAB
// ─────────────────────────────────────────────────────────────────────────────
function TeamsTab() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8080/api/teams", {
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.message || "Failed to load teams");
      setTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load teams");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tab-container">
      <div className="tab-header">
        <div>
          <h1 className="page-title">Teams</h1>
          <p className="page-subtitle">
            Manage your teams and collaborate with members
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-container">
            <FiSearch className="search-icon" size={16} />
            <input
              type="search"
              placeholder="Search teams..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => setSearchQuery("")}
              >
                <FiX size={14} />
              </button>
            )}
          </div>
          <button className="btn-create" onClick={() => setShowCreate(true)}>
            <FiPlus size={15} style={{ marginRight: 6 }} />
            Create Team
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <span className="spinner" />
          Loading teams...
        </div>
      )}

      {error && !loading && (
        <div className="error-banner">
          {error}
          <button
            onClick={loadTeams}
            className="link-btn"
            style={{ marginLeft: 8 }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && teams.length === 0 && (
        <div className="empty-state">
          <FiUsers
            size={40}
            color="#c0c8d8"
            style={{ marginBottom: 12, opacity: 0.6 }}
          />
          <h3 className="empty-title">No teams yet</h3>
          <p className="empty-desc">
            Create your first team to start collaborating with colleagues
          </p>
          <button className="btn-create" onClick={() => setShowCreate(true)}>
            <FiPlus size={15} style={{ marginRight: 6 }} />
            Create Team
          </button>
        </div>
      )}

      {!loading && !error && teams.length > 0 && (() => {
        const filteredTeams = teams.filter((team) => {
          if (!searchQuery.trim()) return true;
          const query = searchQuery.toLowerCase();
          return (
            team.name?.toLowerCase().includes(query) ||
            team.members?.some(m => 
              m.name?.toLowerCase().includes(query) ||
              m.email?.toLowerCase().includes(query)
            )
          );
        });

        return (
          <>
            <div className="cards-grid">
              <button
                className="dash-card dash-card--add"
                onClick={() => setShowCreate(true)}
              >
                <div className="add-card-icon">+</div>
                <div className="add-card-label">Create Team</div>
              </button>
              {filteredTeams.map((team, idx) => (
                <TeamCard key={team.id} team={team} idx={idx} />
              ))}
            </div>

            {filteredTeams.length === 0 && searchQuery && (
              <p className="empty-desc" style={{ marginTop: 16, textAlign: 'center' }}>
                No teams match "{searchQuery}"
              </p>
            )}
          </>
        );
      })()}

      {showCreate && (
        <CreateTeamModal
          onClose={() => setShowCreate(false)}
          onCreated={(t) => setTeams((p) => [...p, t])}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
const NAV_TABS = [
  "Dashboard",
  "Teams",
  "Analytics",
  "Action items",
  "Integrations",
  "Subscription",
];

function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close drawer when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function handleTabSelect(tab) {
    setActiveTab(tab);
    setMenuOpen(false);
  }

  // Current user info
  const userName =
    localStorage.getItem("name") || localStorage.getItem("name") || "User";

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("username");
    navigate("/login");
  }

  // ── Board creation ──
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [boardTitle, setBoardTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [boardError, setBoardError] = useState("");

  // ── User boards ──
  const [userBoards, setUserBoards] = useState([]);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [boardsError, setBoardsError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Templates ──
  const [templates, setTemplates] = useState([]);
  const [templatesError, setTemplatesError] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateList, setShowTemplateList] = useState(false);

  // ── Teams (for board creation dropdown) ──
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamsError, setTeamsError] = useState("");

  // Fetch boards on mount
  useEffect(() => {
    fetchUserBoards();
  }, []);

  async function fetchUserBoards() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    setLoadingBoards(true);
    setBoardsError("");
    try {
      const res = await fetch(
        `http://localhost:8080/api/boards/user/${userId}`,
        {
          headers: authHeaders(),
        },
      );
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.message || "Failed to load boards");
      setUserBoards(Array.isArray(data) ? data : []);
    } catch (err) {
      setBoardsError(err.message || "Failed to load boards");
    } finally {
      setLoadingBoards(false);
    }
  }

  async function ensureTemplatesLoaded() {
    if (loadingTemplates || templates.length > 0) return;
    setLoadingTemplates(true);
    setTemplatesError("");
    try {
      const res = await fetch("http://localhost:8080/api/templates", {
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.message || "Failed to load templates");
      const list = Array.isArray(data) ? data : [];
      setTemplates(list);
      if (!selectedTemplate && list.length > 0) setSelectedTemplate(list[0]);
    } catch (err) {
      setTemplatesError(err.message || "Failed to load templates");
    } finally {
      setLoadingTemplates(false);
    }
  }

  async function ensureTeamsLoaded() {
    if (loadingTeams || teams.length > 0) return;
    setLoadingTeams(true);
    setTeamsError("");
    try {
      const res = await fetch("http://localhost:8080/api/teams", {
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.message || "Failed to load teams");
      setTeams(data);
      if (!selectedTeam && data.length > 0) setSelectedTeam(data[0]);
    } catch (err) {
      setTeamsError(err.message || "Failed to load teams");
    } finally {
      setLoadingTeams(false);
    }
  }

  useEffect(() => {
    if (showCreateBoard) {
      ensureTemplatesLoaded();
      ensureTeamsLoaded();
    }
  }, [showCreateBoard]);

  async function handleCreateBoard(e) {
    e.preventDefault();
    setBoardError("");
    setCreating(true);
    try {
      const userId = localStorage.getItem("userId");
      const res = await fetch("http://localhost:8080/api/boards", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title: boardTitle,
          templateId: selectedTemplate?.id ?? null,
          userId: userId ? Number(userId) : undefined,
          teamId: selectedTeam?.id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to create board");
      setBoardTitle("");
      setSelectedTemplate(null);
      setShowCreateBoard(false);
      fetchUserBoards();
      if (data.id) navigate(`/board/${data.id}`);
    } catch (err) {
      setBoardError(err.message || "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="app dashboard-app">
      {/* Navbar */}
      <div ref={menuRef}>
        <header className="dash-navbar">
          {/* LEFT: Hamburger (mobile) + Logo */}
          <div className="dash-nav-left">
            {/* Hamburger — shown only on small screens via CSS */}
            <button
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

          {/* CENTER: Desktop tab bar (hidden on mobile via CSS) */}
          <div className="nave-bar">
            <nav className="dash-nav-center">
              {NAV_TABS.map((tab) => (
                <button
                  key={tab}
                  className={`dash-tab${activeTab === tab ? " active" : ""}`}
                  onClick={() => handleTabSelect(tab)}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* RIGHT: Profile + Logout (always on right) */}
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

        {/* Mobile drawer — slides in below navbar */}
        <nav className={`dash-mobile-menu${menuOpen ? " open" : ""}`}>
          {NAV_TABS.map((tab) => (
            <button
              key={tab}
              className={`dash-tab${activeTab === tab ? " active" : ""}`}
              onClick={() => handleTabSelect(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <main className="dash-main">
        {activeTab === "Dashboard" && (
          <div className="tab-container">
            <div className="tab-header">
              <h1 className="page-title">
                Dashboard
                {userBoards.length > 0 && (
                  <span className="badge-count" style={{ marginLeft: 10 }}>
                    {userBoards.length}{" "}
                    {userBoards.length === 1 ? "Board" : "Boards"}
                  </span>
                )}
              </h1>
              <div className="search-container">
                <FiSearch className="search-icon" size={16} />
                <input
                  type="search"
                  placeholder="Search boards..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="search-clear"
                    onClick={() => setSearchQuery("")}
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>
            </div>

            {loadingBoards && (
              <div className="loading-state">
                <span className="spinner" />
                Loading your boards...
              </div>
            )}

            {boardsError && !loadingBoards && (
              <div className="error-banner">
                {boardsError}
                <button
                  onClick={fetchUserBoards}
                  className="link-btn"
                  style={{ marginLeft: 8 }}
                >
                  Retry
                </button>
              </div>
            )}

            {!loadingBoards && (() => {
              const filteredBoards = userBoards.filter((board) => {
                if (!searchQuery.trim()) return true;
                const query = searchQuery.toLowerCase();
                return (
                  board.title?.toLowerCase().includes(query) ||
                  board.teamName?.toLowerCase().includes(query) ||
                  board.templateName?.toLowerCase().includes(query)
                );
              });

              return (
                <>
                  <div className="cards-grid">
                    <button
                      type="button"
                      className="dash-card dash-card--add"
                      onClick={() => setShowCreateBoard(true)}
                    >
                      <div className="add-card-icon">+</div>
                      <div className="add-card-label">Add board</div>
                    </button>
                    {filteredBoards.map((board) => (
                      <BoardCard
                        key={board.id}
                        board={board}
                        onClick={() => navigate(`/board/${board.id}`)}
                      />
                    ))}
                  </div>

                  {filteredBoards.length === 0 && searchQuery && (
                    <p className="empty-desc" style={{ marginTop: 16, textAlign: 'center' }}>
                      No boards match "{searchQuery}"
                    </p>
                  )}

                  {filteredBoards.length === 0 && !searchQuery && userBoards.length === 0 && (
                    <p className="empty-desc" style={{ marginTop: 8 }}>
                      No boards yet. Create your first board to get started!
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* ── TEAMS TAB ── */}
        {activeTab === "Teams" && <TeamsTab />}

        {/* ── OTHER TABS ── */}
        {!["Dashboard", "Teams"].includes(activeTab) && (
          <div className="empty-state">
            <h2 style={{ fontSize: 20, marginBottom: 8, color: "#555" }}>
              {activeTab}
            </h2>
            <p className="empty-desc">This section is coming soon.</p>
          </div>
        )}
      </main>

      {/* ── Create Board Modal ── */}
      {showCreateBoard && (
        <div
          className="modal-backdrop"
          onClick={() => !creating && setShowCreateBoard(false)}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2 className="modal-title">Create Board</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateBoard(false)}
                disabled={creating}
              >
                ×
              </button>
            </header>
            <form className="modal-body" onSubmit={handleCreateBoard}>
              <label className="field-group">
                <span className="field-label">Name</span>
                <input
                  className="field-input"
                  type="text"
                  placeholder="Type your board name"
                  value={boardTitle}
                  onChange={(e) => setBoardTitle(e.target.value)}
                  required
                />
              </label>

              <div className="field-group">
                <span className="field-label">Team</span>
                {loadingTeams ? (
                  <div className="field-muted">Loading teams...</div>
                ) : teamsError ? (
                  <div className="field-error">{teamsError}</div>
                ) : teams.length > 0 ? (
                  <select
                    className="field-input"
                    value={selectedTeam?.id ?? teams[0]?.id}
                    onChange={(e) =>
                      setSelectedTeam(
                        teams.find((t) => t.id === Number(e.target.value)),
                      )
                    }
                    required
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="field-muted">No teams available</div>
                )}
              </div>

              <div className="field-group">
                <span className="field-label">Template</span>
                <div className="template-chip">
                  {selectedTemplate
                    ? selectedTemplate.title || selectedTemplate.name
                    : "Went Well - To Improve - Action Items"}
                </div>
                <div className="template-links">
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => {
                      setShowTemplateList((p) => !p);
                      ensureTemplatesLoaded();
                    }}
                  >
                    Change template
                  </button>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => setShowCreateTemplate(true)}
                  >
                    Use custom template
                  </button>
                </div>
                {showTemplateList && (
                  <div className="template-list">
                    {loadingTemplates && (
                      <div className="template-list-item field-muted">
                        Loading templates...
                      </div>
                    )}
                    {templatesError && !loadingTemplates && (
                      <div className="template-list-item field-error">
                        {templatesError}
                      </div>
                    )}
                    {!loadingTemplates &&
                      !templatesError &&
                      templates.length === 0 && (
                        <div className="template-list-item field-muted">
                          No templates available
                        </div>
                      )}
                    {!loadingTemplates &&
                      !templatesError &&
                      templates.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className="template-list-item"
                          onClick={() => {
                            setSelectedTemplate(t);
                            setShowTemplateList(false);
                          }}
                        >
                          {t.title || t.name || `Template ${t.id}`}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {boardError && <p className="field-error">{boardError}</p>}
              <footer className="modal-footer">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating}
                >
                  {creating ? "Creating…" : "Create"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateBoard(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Template Modal ── */}
      {showCreateTemplate && (
        <CreateTemplateModal
          onClose={() => setShowCreateTemplate(false)}
          onCreated={(t) => {
            setTemplates((p) => [...p, t]);
            setSelectedTemplate(t);
            setShowTemplateList(false);
            setShowCreateTemplate(false);
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;
