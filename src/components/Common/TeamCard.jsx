import { FiUsers } from "react-icons/fi";
import { getInitials } from "../../utils";
import { PALETTE } from "../../utils";

export default function TeamCard({ team, idx, isDeleting }) {
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
