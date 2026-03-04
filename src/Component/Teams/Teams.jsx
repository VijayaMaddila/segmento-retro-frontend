import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiUsers, FiX, FiSearch } from "react-icons/fi";
import api from "../../api";
import ProfileDropdown from "../Common/ProfileDropdown";
import "./teams.css";

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
    api.get("/api/users")
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
          await api.post(`/api/teams/${data.id}/invite`, inviteEmails);
          alert(`Team created successfully! Invitation emails sent to ${inviteEmails.length} recipient(s).`);
        } catch (inviteErr) {
          console.error("Error sending invitations:", inviteErr);
          if (inviteErr.message?.includes("403")) {
            alert("Team created successfully, but you don't have permission to send invitations.");
          } else {
            alert("Team created successfully, but failed to send invitation emails.");
          }
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
            <form onSubmit={handleAddEmail} style={{ display: "flex", gap: "8px" }}>
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

function TeamCard({ team, idx }) {
  const { bg, accent } = PALETTE[idx % PALETTE.length];
  const memberCount = team.members?.length || 0;

  return (
    <div 
      className="dash-card" 
      style={{ background: bg }}
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

function Teams() {
  const navigate = useNavigate();
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

  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTeams = filteredTeams.slice(startIndex, endIndex);

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
            <button className="dash-tab active">
              Teams
            </button>
            <button className="dash-tab" onClick={() => navigate("/analytics")}>
              Analytics
            </button>
            <button className="dash-tab" onClick={() => navigate("/integrations")}>
              Integrations
            </button>
            
          </nav>
        </div>
        <ProfileDropdown />
      </header>

      <main className="dash-main">
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

          {!loading && !error && teams.length > 0 && (
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
                  <TeamCard
                    key={team.id}
                    team={team}
                    idx={startIndex + idx}
                  />
                ))}
              </div>

              {filteredTeams.length > itemsPerPage && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>
                  <div className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
          )}

          {showCreate && (
            <CreateTeamModal
              onClose={() => setShowCreate(false)}
              onCreated={(t) => setTeams((p) => [...p, t])}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default Teams;
