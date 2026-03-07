import { useState, useEffect } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import api from "../../api";
import { getInitials } from "../../utils";

export default function CreateTeamModal({ onClose, onCreated }) {
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
        u.email?.toLowerCase().includes(memberSearch.toLowerCase()))
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
          alert(
            `Team created successfully! Invitation emails sent to ${inviteEmails.length} recipient(s).`
          );
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
                  <span className="spinner spinner--sm" /> Loading users...
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
