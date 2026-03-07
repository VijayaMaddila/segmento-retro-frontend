import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import DashboardLayout from "../Common/DashboardLayout";
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
            const cards = await api.get(`/api/cards/board/${board.id}`);
            if (Array.isArray(cards)) {
              cardCount = cards.length;
              cards.forEach((card) => {
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
    return (
      <DashboardLayout
        title="Analytics"
        subtitle="Track your team's retrospective activity and insights"
        activeTab="analytics"
      >
        <div className="analytics-loading">Loading analytics...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Analytics"
      subtitle="Track your team's retrospective activity and insights"
      activeTab="analytics"
    >
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
                  <td colSpan="6" className="no-data">
                    No boards found
                  </td>
                </tr>
              ) : (
                boards.map((board) => (
                  <tr key={board.id}>
                    <td className="board-name">{board.title}</td>
                    <td>{new Date(board.createdAt).toLocaleDateString()}</td>
                    <td>
                      {new Date(
                        board.updatedAt || board.createdAt
                      ).toLocaleDateString()}
                    </td>
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
    </DashboardLayout>
  );
}

export default Analytics;
