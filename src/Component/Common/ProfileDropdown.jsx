import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import "./ProfileDropdown.css";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ProfileDropdown() {
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    email: "",
    role: "MEMBER"
  });
  const profileMenuRef = useRef(null);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const data = await api.get(`/api/users/${userId}`);
        setUserProfile({
          name: data.name || data.username || "User",
          email: data.email || data.emailId || data.mail || "No email",
          role: data.role || "MEMBER"
        });
        if (data.id && !localStorage.getItem("userId")) {
          localStorage.setItem("userId", data.id);
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setUserProfile({
          name: localStorage.getItem("name") || "User",
          email: localStorage.getItem("email") || "No email",
          role: localStorage.getItem("role") || "MEMBER"
        });
      }
    }
    fetchUserProfile();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    }
    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  function handleLogout() {
    localStorage.clear();
    navigate("/login");
  }

  function handleEditName() {
    setNewName(userProfile.name);
    setEditingName(true);
  }

  async function handleSaveName() {
    if (!newName.trim()) return;
    try {
      const userId = localStorage.getItem("userId");
      await api.put(`/api/users/${userId}`, { name: newName.trim() });
      setUserProfile(prev => ({ ...prev, name: newName.trim() }));
      localStorage.setItem("name", newName.trim());
      setEditingName(false);
    } catch (err) {
      alert("Failed to update name: " + (err.message || "Unknown error"));
    }
  }

  return (
    <div className="dash-nav-right" ref={profileMenuRef}>
      <div 
        className="nav-profile" 
        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
        style={{ cursor: 'pointer' }}
      >
        <div className="nav-avatar">{getInitials(userProfile.name)}</div>
        <span className="nav-username">{userProfile.name}</span>
      </div>
      
      {profileMenuOpen && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-header">
            <div className="profile-dropdown-avatar">{getInitials(userProfile.name)}</div>
            <div className="profile-dropdown-info">
              {editingName ? (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="profile-name-input"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <button onClick={handleSaveName} className="profile-save-btn">✓</button>
                  <button onClick={() => setEditingName(false)} className="profile-cancel-btn">✕</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="profile-dropdown-name">{userProfile.name}</span>
                  <button onClick={handleEditName} className="profile-edit-btn">✎</button>
                </div>
              )}
              <span className="profile-dropdown-email">{userProfile.email}</span>
              <span className="profile-dropdown-role">{userProfile.role}</span>
            </div>
          </div>
          <div className="profile-dropdown-divider"></div>
          <button className="profile-dropdown-item" onClick={handleLogout}>
            <span>🚪</span> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
