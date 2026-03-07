import { useState, useEffect } from "react";
import { FiPlus, FiUsers, FiX, FiSearch } from "react-icons/fi";
import api from "../../api";
import CreateTeamModal from "../Common/CreateTeamModal";
import TeamCard from "../Common/TeamCard";
import DashboardLayout from "../Common/DashboardLayout";
import "./teams.css";

function Teams() {
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
          m.email?.toLowerCase().includes(query)
      )
    );
  });

  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTeams = filteredTeams.slice(startIndex, endIndex);

  return (
    <DashboardLayout
      title="Teams"
      subtitle="Manage your teams and collaborate with members"
      activeTab="teams"
      headerActions={
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
      }
    >

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
    </DashboardLayout>
  );
}

export default Teams;
