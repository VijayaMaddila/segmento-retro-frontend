import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiTrash2, FiUsers, FiX, FiSearch } from "react-icons/fi";
import TemplateSelector from "../Templates/TemplateSelector";
import api from "../../api";
import "./dashboard.css";

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

// CREATE TEMPLATE MODAL
function CreateTemplateModal({ onClose, onCreated }) {
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Retrospective");
  const [language, setLanguage] = useState("English");
  const [columns, setColumns] = useState([
    { uid: 1, name: "" },
    { uid: 2, name: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    "Retrospective",
    "Brainstorm",
    "Team building",
    "Design thinking / UX",
    "Project management",
    "Product management",
    "Icebreakers",
    "Personal",
    "Decision making",
  ];

  const languages = ["English", "Portuguese", "Spanish", "French"];

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
    if (!description.trim()) return setError("Please enter a description.");
    const filled = columns.filter((c) => c.name.trim());
    if (!filled.length) return setError("Please add at least one column.");
    setSaving(true);
    try {
      const data = await api.post("/api/templates", {
        title: templateName.trim(),
        description: description.trim(),
        category: category,
        language: language,
        columns: filled.map((c, i) => ({
          name: c.name.trim(),
          position: i,
        })),
      });
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

          <label className="field-group">
            <span className="field-label">Description</span>
            <textarea
              className="field-input"
              rows="3"
              placeholder="Describe what this template is for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="field-group">
            <span className="field-label">Category</span>
            <select
              className="field-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label className="field-group">
            <span className="field-label">Language</span>
            <select
              className="field-input"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
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
// CREATE TEAM MODAL
function CreateTeamModal({ onClose, onCreated }) {
  const [teamName, setTeamName] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [inviteEmails, setInviteEmails] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoadingUsers(true);
    api
      .get("/api/users")
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

  function handleAddEmail(e) {
    e.preventDefault();
    const email = emailInput.trim();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (inviteEmails.includes(email)) {
      setError("This email is already added");
      return;
    }

    setInviteEmails((p) => [...p, email]);
    setEmailInput("");
    setError("");
  }

  function removeEmail(email) {
    setInviteEmails((p) => p.filter((e) => e !== email));
  }

  async function handleSave() {
    setError("");
    if (!teamName.trim()) return setError("Please enter a team name.");
    setSaving(true);
    try {
      const userId = localStorage.getItem("userId");
      const data = await api.post("/api/teams/create", {
        name: teamName.trim(),
        createdBy: userId ? Number(userId) : null,
        members: selectedMembers.map((m) => m.id),
      });

      if (inviteEmails.length > 0) {
        try {
          console.log("Sending invitations to:", inviteEmails);
          console.log("Team ID:", data.id);

          await api.post(`/api/teams/${data.id}/invite`, inviteEmails);

          console.log("Invitations sent successfully");
          alert(
            `Team created successfully! Invitation emails sent to ${inviteEmails.length} recipient(s).`,
          );
        } catch (inviteErr) {
          console.error("Error sending invitations:", inviteErr);
          alert(
            "Team created successfully, but failed to send invitation emails. Please try inviting members again later.",
          );
        }
      } else {
        alert("Team created successfully!");
      }

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

          <div className="field-group">
            <span className="field-label">
              Add Members
              {allUsers.length > 0 && (
                <span className="badge-muted">
                  {allUsers.length} users available
                </span>
              )}
            </span>

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

          <div className="field-group">
            <span className="field-label">Invite by Email</span>
            <form
              onSubmit={handleAddEmail}
              style={{ display: "flex", gap: "8px" }}
            >
              <input
                type="email"
                className="field-input"
                placeholder="Enter email address..."
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: "8px 16px", whiteSpace: "nowrap" }}
              >
                Add Email
              </button>
            </form>

            {inviteEmails.length > 0 && (
              <div className="selected-members" style={{ marginTop: "12px" }}>
                <span className="selected-label">
                  Email Invitations ({inviteEmails.length})
                </span>
                <div className="chip-wrap">
                  {inviteEmails.map((email) => (
                    <div key={email} className="member-chip">
                      <span className="chip-name">{email}</span>
                      <button
                        type="button"
                        className="chip-remove"
                        onClick={() => removeEmail(email)}
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

// SHARED CARD COMPONENT
function BoardCard({ board, onClick, onDelete }) {
  const { bg, accent } = PALETTE[board.id % PALETTE.length];
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  return (
    <div
      className="dash-card"
      style={{ background: bg, cursor: "pointer", position: "relative" }}
    >
      <div className="dash-card-accent" style={{ background: accent }} />
      <div className="card-menu-wrapper" ref={menuRef}>
        <button
          className="card-menu-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
        >
          ⋮
        </button>
        {showMenu && (
          <div className="card-dropdown-menu">
            <button
              className="card-dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onClick();
              }}
            >
              <span>👁</span> Open Board
            </button>
            <button
              className="card-dropdown-item delete"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onDelete(board.id);
              }}
            >
              <span>✕</span> Delete Board
            </button>
          </div>
        )}
      </div>
      <div className="dash-card-body" onClick={onClick}>
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

function TeamCard({ team, idx, isDeleting }) {
  const { bg, accent } = PALETTE[idx % PALETTE.length];
  const memberCount = team.members?.length || 0;

  return (
    <div
      className="dash-card"
      style={{
        background: bg,
        position: "relative",
        opacity: isDeleting ? 0.5 : 1,
        pointerEvents: isDeleting ? "none" : "auto",
        transition: "opacity 0.3s ease",
      }}
    >
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
// TEAMS TAB
function TeamsTab() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  useEffect(() => {
    loadTeams();
  }, []);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  async function loadTeams() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/api/teams");
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
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
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

      {!loading &&
        !error &&
        teams.length > 0 &&
        (() => {
          const filteredTeams = teams.filter((team) => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            return (
              team.name?.toLowerCase().includes(query) ||
              team.members?.some(
                (m) =>
                  m.name?.toLowerCase().includes(query) ||
                  m.email?.toLowerCase().includes(query),
              )
            );
          });

          // Pagination logic
          const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedTeams = filteredTeams.slice(startIndex, endIndex);

          return (
            <>
              <div className="cards-grid">
                {currentPage === 1 && (
                  <button
                    className="dash-card dash-card--add"
                    onClick={() => setShowCreate(true)}
                  >
                    <div className="add-card-icon">+</div>
                    <div className="add-card-label">Create Team</div>
                  </button>
                )}
                {paginatedTeams.map((team, idx) => (
                  <TeamCard key={team.id} team={team} idx={startIndex + idx} />
                ))}
              </div>

              {filteredTeams.length > itemsPerPage && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>
                  <div className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    className="pagination-btn"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}

              {filteredTeams.length === 0 && searchQuery && (
                <p
                  className="empty-desc"
                  style={{ marginTop: 16, textAlign: "center" }}
                >
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
// DASHBOARD
const NAV_TABS = ["Dashboard", "Teams", "Analytics", "Integrations"];

function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const menuRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target)
      ) {
        setProfileMenuOpen(false);
      }
    }
    if (menuOpen || profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, profileMenuOpen]);

  function handleTabSelect(tab) {
    if (tab === "Analytics") {
      navigate("/analytics");
      return;
    }

    if (tab === "Integrations") {
      navigate("/integrations");
      return;
    }

    if (tab === "Teams") {
      navigate("/teams");
      return;
    }

    // Only MEMBER role is restricted to Dashboard
    if (userRole === "MEMBER" && tab !== "Dashboard") {
      alert(
        "You don't have permission to access this section. Members can only view boards.",
      );
      return;
    }

    setActiveTab(tab);
    setMenuOpen(false);
  }

  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    email: "",
    role: "MEMBER",
  });
  const userName = userProfile.name;
  const userRole = userProfile.role;

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const data = await api.get("/api/users/current");
        console.log("User profile data:", data);
        setUserProfile({
          name: data.name || data.username || "User",
          email: data.email || data.emailId || data.mail || "No email",
          role: data.role || "MEMBER",
        });
        // Store userId if not already stored
        if (data.id && !localStorage.getItem("userId")) {
          localStorage.setItem("userId", data.id);
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        // Fallback to localStorage only if API fails
        setUserProfile({
          name: localStorage.getItem("name") || "User",
          email: localStorage.getItem("email") || "No email",
          role: localStorage.getItem("role") || "MEMBER",
        });
      }
    }
    fetchUserProfile();
  }, []);

  // Debug logging for role
  useEffect(() => {
    console.log("Dashboard - User Role:", userRole);
    console.log("Dashboard - User Name:", userName);
  }, [userRole, userName]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("username");
    localStorage.removeItem("name");
    localStorage.removeItem("role");
    navigate("/login");
  }

  function handleEditName() {
    setNewName(userName);
    setEditingName(true);
  }

  async function handleSaveName() {
    if (!newName.trim()) return;
    try {
      const userId = localStorage.getItem("userId");
      await api.put(`/api/users/${userId}`, { name: newName.trim() });

      // Update local state and localStorage
      setUserProfile((prev) => ({ ...prev, name: newName.trim() }));
      localStorage.setItem("name", newName.trim());
      setEditingName(false);
    } catch (err) {
      alert("Failed to update name: " + (err.message || "Unknown error"));
    }
  }

  // ── Board creation ──
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [boardTitle, setBoardTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [boardError, setBoardError] = useState("");

  // ── User boards ──
  const [userBoards, setUserBoards] = useState([]);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [boardsError, setBoardsError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

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

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  async function fetchUserBoards() {
    const userId = localStorage.getItem("userId");
    const userRole = localStorage.getItem("role") || "MEMBER";
    if (!userId) return;
    setLoadingBoards(true);
    setBoardsError("");
    try {
      // All roles use the same endpoint - backend filters based on role and team membership
      const data = await api.get(`/api/boards/user/${userId}`);
      setUserBoards(Array.isArray(data) ? data : []);
    } catch (err) {
      setBoardsError(err.message || "Failed to load boards");
    } finally {
      setLoadingBoards(false);
    }
  }

  async function handleDeleteBoard(boardId) {
    const userRole = localStorage.getItem("role") || "MEMBER";
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this board? All columns and cards will be permanently deleted.",
    );
    if (!confirmDelete) return;

    try {
      console.log("Deleting board:", boardId);
      await api.delete(`/api/boards/${boardId}`);

      console.log("Delete successful");

      // Remove board from UI instantly
      setUserBoards((prev) => prev.filter((b) => b.id !== boardId));

      alert("Board deleted successfully!");
    } catch (err) {
      console.error("Error deleting board:", err);
      alert("Error deleting board: " + (err.message || "Unknown"));
    }
  }

  async function ensureTemplatesLoaded() {
    if (loadingTemplates || templates.length > 0) return;
    setLoadingTemplates(true);
    setTemplatesError("");
    try {
      const data = await api.get("/api/templates");
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
      const data = await api.get("/api/teams");
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
      const data = await api.post("/api/boards", {
        title: boardTitle,
        templateId: selectedTemplate?.id ?? null,
        userId: userId ? Number(userId) : undefined,
        teamId: selectedTeam?.id,
      });
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

  async function handleTemplateSelect(template) {
    // Close template selector and set the selected template
    setShowTemplateSelector(false);
    setSelectedTemplate(template);

    // Pre-fill board title with template title if empty
    if (!boardTitle) {
      setBoardTitle(template.title);
    }

    // Show the create board modal so user can confirm/edit name and select team
    setShowCreateBoard(true);
  }

  function handleCloseCreateBoard() {
    setShowCreateBoard(false);
    setBoardTitle("");
    setSelectedTemplate(null);
    setBoardError("");
  }

  async function handleCreateBoardWithTemplate(e) {
    e.preventDefault();

    // If a template is selected, create board with template
    if (selectedTemplate) {
      setBoardError("");
      setCreating(true);

      try {
        const userId = localStorage.getItem("userId");

        // Create board
        const board = await api.post("/api/boards", {
          title: boardTitle,
          templateId: selectedTemplate.id,
          userId: userId ? Number(userId) : undefined,
          teamId: selectedTeam?.id,
        });

        // Increment template usage count
        if (selectedTemplate.id) {
          await api
            .post(`/api/templates/${selectedTemplate.id}/use`)
            .catch((err) => {
              console.warn("Failed to increment template usage:", err);
            });
        }

        // Create columns from template
        if (
          selectedTemplate.columns &&
          Array.isArray(selectedTemplate.columns)
        ) {
          for (const column of selectedTemplate.columns) {
            await api.post(`/api/board-columns/${board.id}`, {
              title: column.name || column.title,
              position: column.position,
              boardId: board.id,
            });
          }
        }

        setBoardTitle("");
        setSelectedTemplate(null);
        setShowCreateBoard(false);
        fetchUserBoards();
        if (board.id) navigate(`/board/${board.id}`);
      } catch (err) {
        setBoardError(err.message || "Failed to create board from template");
      } finally {
        setCreating(false);
      }
    } else {
      // Regular board creation without template
      handleCreateBoard(e);
    }
  }

  return (
    <div className="app dashboard-app">
      <div ref={menuRef}>
        <header className="dash-navbar">
          <div className="dash-nav-left">
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
          <div className="nave-bar">
            <nav className="dash-nav-center">
              {NAV_TABS.map((tab) => {
                if (userRole === "MEMBER" && tab !== "Dashboard") {
                  return null;
                }
                return (
                  <button
                    key={tab}
                    className={`dash-tab${activeTab === tab ? " active" : ""}`}
                    onClick={() => handleTabSelect(tab)}
                  >
                    {tab}
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="dash-nav-right" ref={profileMenuRef}>
            <div
              className="nav-profile"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              style={{ cursor: "pointer" }}
            >
              <div className="nav-avatar">{getInitials(userName)}</div>
              <span className="nav-username">{userName}</span>
            </div>

            {profileMenuOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <div className="profile-dropdown-avatar">
                    {getInitials(userName)}
                  </div>
                  <div className="profile-dropdown-info">
                    {editingName ? (
                      <div
                        style={{
                          display: "flex",
                          gap: "4px",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="profile-name-input"
                          autoFocus
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleSaveName()
                          }
                        />
                        <button
                          onClick={handleSaveName}
                          className="profile-save-btn"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setEditingName(false)}
                          className="profile-cancel-btn"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span className="profile-dropdown-name">
                          {userName}
                        </span>
                        <button
                          onClick={handleEditName}
                          className="profile-edit-btn"
                        >
                          ✎
                        </button>
                      </div>
                    )}
                    <span className="profile-dropdown-email">
                      {userProfile.email || "No email"}
                    </span>
                    <span className="profile-dropdown-role">
                      {userProfile.role}
                    </span>
                  </div>
                </div>
                <div className="profile-dropdown-divider"></div>
                <button
                  className="profile-dropdown-item"
                  onClick={handleLogout}
                >
                  <span>🚪</span> Log out
                </button>
              </div>
            )}
          </div>
        </header>
        <nav className={`dash-mobile-menu${menuOpen ? " open" : ""}`}>
          {NAV_TABS.map((tab) => {
            if (userRole === "MEMBER" && tab !== "Dashboard") {
              return null;
            }
            return (
              <button
                key={tab}
                className={`dash-tab${activeTab === tab ? " active" : ""}`}
                onClick={() => handleTabSelect(tab)}
              >
                {tab}
              </button>
            );
          })}
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

            {!loadingBoards &&
              (() => {
                const filteredBoards = userBoards.filter((board) => {
                  if (!searchQuery.trim()) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    board.title?.toLowerCase().includes(query) ||
                    board.teamName?.toLowerCase().includes(query) ||
                    board.templateName?.toLowerCase().includes(query)
                  );
                });

                // Pagination logic
                const totalPages = Math.ceil(
                  filteredBoards.length / itemsPerPage,
                );
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedBoards = filteredBoards.slice(
                  startIndex,
                  endIndex,
                );

                return (
                  <>
                    <div className="cards-grid">
                      {(userRole === "ADMIN" || userRole === "MANAGER") &&
                        currentPage === 1 && (
                          <button
                            type="button"
                            className="dash-card dash-card--add"
                            onClick={() => setShowCreateBoard(true)}
                          >
                            <div className="add-card-icon">+</div>
                            <div className="add-card-label">Add board</div>
                          </button>
                        )}
                      {paginatedBoards.map((board) => (
                        <BoardCard
                          key={board.id}
                          board={board}
                          onClick={() => navigate(`/board/${board.id}`)}
                          onDelete={handleDeleteBoard}
                        />
                      ))}
                    </div>

                    {filteredBoards.length > itemsPerPage && (
                      <div className="pagination">
                        <button
                          className="pagination-btn"
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          ← Previous
                        </button>
                        <div className="pagination-info">
                          Page {currentPage} of {totalPages}
                        </div>
                        <button
                          className="pagination-btn"
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                        >
                          Next →
                        </button>
                      </div>
                    )}

                    {filteredBoards.length === 0 && searchQuery && (
                      <p
                        className="empty-desc"
                        style={{ marginTop: 16, textAlign: "center" }}
                      >
                        No boards match "{searchQuery}"
                      </p>
                    )}

                    {filteredBoards.length === 0 &&
                      !searchQuery &&
                      userBoards.length === 0 && (
                        <div className="empty-state">
                          {userRole === "MEMBER" ? (
                            <>
                              <h3 className="empty-title">
                                No boards assigned yet
                              </h3>
                              <p className="empty-desc">
                                You haven't been assigned to any boards yet.
                                Please wait for your team administrator to add
                                you to a board, or contact them for access.
                              </p>
                            </>
                          ) : (
                            <p className="empty-desc" style={{ marginTop: 8 }}>
                              No boards yet. Create your first board to get
                              started!
                            </p>
                          )}
                        </div>
                      )}
                  </>
                );
              })()}
          </div>
        )}
        {activeTab === "Teams" && <TeamsTab />}
        {!["Dashboard", "Teams"].includes(activeTab) && (
          <div className="empty-state">
            <h2 style={{ fontSize: 20, marginBottom: 8, color: "#555" }}>
              {activeTab}
            </h2>
            <p className="empty-desc">This section is coming soon.</p>
          </div>
        )}
      </main>
      {showCreateBoard && (
        <div
          className="modal-backdrop"
          onClick={() => !creating && handleCloseCreateBoard()}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2 className="modal-title">Create Board</h2>
              <button
                className="modal-close"
                onClick={handleCloseCreateBoard}
                disabled={creating}
              >
                ×
              </button>
            </header>
            <form
              className="modal-body"
              onSubmit={handleCreateBoardWithTemplate}
            >
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
                    onClick={async () => {
                      await ensureTeamsLoaded();
                      setShowTemplateSelector(true);
                      setShowCreateBoard(false);
                    }}
                  >
                    Browse templates
                  </button>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => {
                      setShowTemplateList((p) => !p);
                      ensureTemplatesLoaded();
                    }}
                  >
                    Quick select
                  </button>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => setShowCreateTemplate(true)}
                  >
                    Custom template
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
                  onClick={handleCloseCreateBoard}
                  disabled={creating}
                >
                  Cancel
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
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
      {showTemplateSelector && (
        <TemplateSelector
          onSelectTemplate={handleTemplateSelect}
          onClose={() => {
            setShowTemplateSelector(false);
            setShowCreateBoard(true);
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;
