import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./analytics.css";

function Analytics() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      
      const res = await fetch(
        `http://localhost:8080/api/boards/user/${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      
      const data = await res.json().catch(() => []);
      setBoards(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <div className="analytics-header-left">
          <div className="analytics-logo" onClick={() => navigate("/retroDashboard")}>
            SegmentoRetro
          </div>
        </div>
        <h1 className="analytics-title">Analytics</h1>
        <div className="analytics-header-right">
          <button className="btn-back" onClick={() => navigate("/retroDashboard")}>
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="analytics-main">
        <div className="analytics-section">
          <h2 className="section-title">Public Boards</h2>
          
          <div className="analytics-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Retro name</th>
                  <th>Created date</th>
                  <th>Last modified</th>
                  <th>Cards</th>
                  <th>Votes</th>
                  <th>Contributors</th>
                  <th>Viewers</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {boards.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-data">No boards found</td>
                  </tr>
                ) : (
                  boards.map((board) => (
                    <tr key={board.id}>
                      <td className="board-name">{board.title}</td>
                      <td>{new Date(board.createdAt).toLocaleDateString()}</td>
                      <td>{new Date(board.updatedAt || board.createdAt).toLocaleDateString()}</td>
                      <td>{board.cardCount || 0}</td>
                      <td>{board.voteCount || 0}</td>
                      <td>{board.contributorCount || 1}</td>
                      <td>{board.viewerCount || 0}</td>
                      <td>
                        <button 
                          className="btn-view"
                          onClick={() => navigate(`/board/${board.id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Analytics;
