import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import ProfileDropdown from "../Common/ProfileDropdown";
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
      
      const data = await api.get(`/api/boards/user/${userId}`);
      const boardsArray = Array.isArray(data) ? data : [];
      
  
      const boardsWithAnalytics = await Promise.all(
        boardsArray.map(async (board) => {
          let cardCount = 0;
          const contributors = new Set();
          
          try {
            // Fetch cards for this board
            const cards = await api.get(`/api/cards/board/${board.id}`);
            if (Array.isArray(cards)) {
              cardCount = cards.length;
              
            
              cards.forEach(card => {
                if (card.userId) {
                  contributors.add(card.userId);
                }
              });
            }
          } catch (err) {
            console.error(`Error fetching cards for board ${board.id}:`, err);
          }
          
          return {
            ...board,
            cardCount,
            contributorCount: contributors.size || 1,
          };
        })
      );
      
      setBoards(boardsWithAnalytics);
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
            <button className="dash-tab" onClick={() => navigate("/teams")}>
              Teams
            </button>
            <button className="dash-tab active">
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
              <h1 className="page-title">Analytics</h1>
              <p className="page-subtitle">
                Track your team's retrospective activity and insights
              </p>
            </div>
          </div>

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
                    <th>Contributors</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {boards.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">No boards found</td>
                    </tr>
                  ) : (
                    boards.map((board) => (
                      <tr key={board.id}>
                        <td className="board-name">{board.title}</td>
                        <td>{new Date(board.createdAt).toLocaleDateString()}</td>
                        <td>{new Date(board.updatedAt || board.createdAt).toLocaleDateString()}</td>
                        <td>{board.cardCount || 0}</td>
                        <td>{board.contributorCount || 1}</td>
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
        </div>
      </main>
    </div>
  );
}

export default Analytics;
