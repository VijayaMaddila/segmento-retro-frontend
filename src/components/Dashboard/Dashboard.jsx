import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiTrash2, FiUsers, FiX, FiSearch } from "react-icons/fi";
import TemplateSelector from "../Templates/TemplateSelector";
import CreateTemplateModal from "../Templates/CreateTemplateModal";
import CreateTeamModal from "../Common/CreateTeamModal";
import TeamCard from "../Common/TeamCard";
import api from "../../api";
import { getInitials, formatDate, PALETTE } from "../../utils";
import { useClickOutside } from "../../hooks";
import "./dashboard.css";

//Board Card

function BoardCard({ board, onClick, onDelete }) {
  const { bg, accent } = PALETTE[board.id % PALETTE.length];
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  useClickOutside(menuRef, () => setShowMenu(false), showMenu);

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
          {board.teamName ? (
            <span className="dash-card-meta" style={{ color: accent }}>
              <FiUsers
                size={11}
                style={{ marginRight: 3, verticalAlign: "middle" }}
              />
              {board.teamName}
            </span>
          ) : board.templateName ? (
            <span className="dash-card-meta" style={{ color: accent }}>
              {board.templateName}
            </span>
          ) : null}
        </div>
      </div>

      {formatDate(board.createdAt) && (
        <div className="dash-card-date">{formatDate(board.createdAt)}</div>
      )}
    </div>
  );
}

//Teams Tab

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
  const paginatedTeams = filteredTeams.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

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
            <FiPlus size={15} style={{ marginRight: 6 }} /> Create Team
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <span className="spinner" /> Loading teams...
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
            <FiPlus size={15} style={{ marginRight: 6 }} /> Create Team
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
                idx={(currentPage - 1) * itemsPerPage + idx}
              />
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
      )}

      {showCreate && (
        <CreateTeamModal
          onClose={() => setShowCreate(false)}
          onCreated={(t) => setTeams((p) => [...p, t])}
        />
      )}
    </div>
  );
}

//Dashboard

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

  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    email: "",
    role: "MEMBER",
  });
  const { name: userName, role: userRole } = userProfile;

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const userId = localStorage.getItem("userId");

        if (!userId) return;
        const data = await api.get(`/api/users/${userId}`);
        setUserProfile({
          name: data.name || data.username,
          email: data.email || "No email",
          role: data.role || "MEMBER",
        });
        if (data.id && !localStorage.getItem("userId")) {
          localStorage.setItem("userId", data.id);
        }
      } catch {
        setUserProfile({
          name: localStorage.getItem("name") || "User",
          email: localStorage.getItem("email") || "No email",
          role: localStorage.getItem("role") || "MEMBER",
        });
      }
    }
    fetchUserProfile();
  }, []);

  const closeMenus = useCallback(() => {
    setMenuOpen(false);
    setProfileMenuOpen(false);
  }, []);
  const dashboardMenuRefs = useMemo(() => [menuRef, profileMenuRef], []);
  useClickOutside(dashboardMenuRefs, closeMenus, menuOpen || profileMenuOpen);

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
    if (userRole === "MEMBER" && tab !== "Dashboard") {
      alert("You don't have permission to access this section.");
      return;
    }
    setActiveTab(tab);
    setMenuOpen(false);
  }

  function handleLogout() {
    ["token", "userId", "userName", "username", "name", "role"].forEach((k) =>
      localStorage.removeItem(k),
    );
    navigate("/login");
  }

  async function handleSaveName() {
    if (!newName.trim()) return;
    try {
      const userId = localStorage.getItem("userId");
      await api.put(`/api/users/${userId}`, { name: newName.trim() });
      setUserProfile((prev) => ({ ...prev, name: newName.trim() }));
      localStorage.setItem("name", newName.trim());
      setEditingName(false);
    } catch (err) {
      alert("Failed to update name: " + (err.message || "Unknown error"));
    }
  }

  // ── Board state ──
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [boardTitle, setBoardTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [boardError, setBoardError] = useState("");

  const [userBoards, setUserBoards] = useState([]);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [boardsError, setBoardsError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [templates, setTemplates] = useState([]);
  const [templatesError, setTemplatesError] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateList, setShowTemplateList] = useState(false);

  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamsError, setTeamsError] = useState("");

  useEffect(() => {
    fetchUserBoards();
  }, []);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (showCreateBoard) {
      ensureTemplatesLoaded();
      ensureTeamsLoaded();
    }
  }, [showCreateBoard]);

  async function fetchUserBoards() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    setLoadingBoards(true);
    setBoardsError("");
    try {
      const data = await api.get(`/api/boards/user/${userId}`);
      setUserBoards(Array.isArray(data) ? data : []);
    } catch (err) {
      setBoardsError(err.message || "Failed to load boards");
    } finally {
      setLoadingBoards(false);
    }
  }

  async function handleDeleteBoard(boardId) {
    if (
      !window.confirm(
        "Are you sure you want to delete this board? All columns and cards will be permanently deleted.",
      )
    )
      return;
    try {
      await api.delete(`/api/boards/${boardId}`);
      setUserBoards((prev) => prev.filter((b) => b.id !== boardId));
      alert("Board deleted successfully!");
    } catch (err) {
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

  function handleCloseCreateBoard() {
    setShowCreateBoard(false);
    setBoardTitle("");
    setSelectedTemplate(null);
    setBoardError("");
  }

  async function handleCreateBoard(e) {
    e.preventDefault();
    setBoardError("");
    setCreating(true);
    try {
      const userId = localStorage.getItem("userId");
      const board = await api.post("/api/boards", {
        title: boardTitle,
        templateId: selectedTemplate?.id ?? null,
        userId: userId ? Number(userId) : undefined,
        teamId: selectedTeam?.id,
      });

      if (selectedTemplate?.id) {
        api.post(`/api/templates/${selectedTemplate.id}/use`).catch(() => {});
      }

      setBoardTitle("");
      setSelectedTemplate(null);
      setShowCreateBoard(false);
      fetchUserBoards();
      if (board.id) navigate(`/board/${board.id}`);
    } catch (err) {
      setBoardError(err.message || "Failed to create board");
    } finally {
      setCreating(false);
    }
  }

  function handleTemplateSelect(template) {
    setShowTemplateSelector(false);
    setSelectedTemplate(template);
    if (!boardTitle) setBoardTitle(template.title);
    setShowCreateBoard(true);
  }

  const filteredBoards = userBoards.filter((board) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      board.title?.toLowerCase().includes(query) ||
      board.teamName?.toLowerCase().includes(query) ||
      board.templateName?.toLowerCase().includes(query)
    );
  });
  const totalPages = Math.ceil(filteredBoards.length / itemsPerPage);
  const paginatedBoards = filteredBoards.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const canManage = userRole === "ADMIN" || userRole === "MANAGER";

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
                if (userRole === "MEMBER" && tab !== "Dashboard") return null;
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
                          onClick={() => {
                            setNewName(userName);
                            setEditingName(true);
                          }}
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
                <div className="profile-dropdown-divider" />
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
            if (userRole === "MEMBER" && tab !== "Dashboard") return null;
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
                <span className="spinner" /> Loading your boards...
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

            {!loadingBoards && (
              <>
                <div className="cards-grid">
                  {canManage && currentPage === 1 && (
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
                            You haven't been assigned to any boards yet. Please
                            wait for your team administrator to add you to a
                            board, or contact them for access.
                          </p>
                        </>
                      ) : (
                        <p className="empty-desc" style={{ marginTop: 8 }}>
                          No boards yet. Create your first board to get started!
                        </p>
                      )}
                    </div>
                  )}
              </>
            )}
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

      {/* ── Create Board Modal ── */}
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

      {/* ── Template Selector ── */}
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
