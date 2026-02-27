import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./board.css";

function Board() {
  const { boardId } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [columns, setColumns] = useState([]);

  const [editingColumnId, setEditingColumnId] = useState(null);
  const [cardInput, setCardInput] = useState("");
  const [cards, setCards] = useState({});
  const [savingCard, setSavingCard] = useState(false);

  // comments state
  const [openCommentsCardKey, setOpenCommentsCardKey] = useState(null);
  const [commentsByCard, setCommentsByCard] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [postingCommentCard, setPostingCommentCard] = useState(null);

  useEffect(() => {
    fetchBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  async function fetchBoard() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const boardResponse = await fetch(
        `http://localhost:8080/api/boards/${boardId}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      const boardData = await boardResponse.json().catch(() => ({}));
      if (!boardResponse.ok)
        throw new Error(boardData.message || "Failed to load board");
      setBoard(boardData);

      const columnsResponse = await fetch(
        `http://localhost:8080/api/board-columns/board/${boardId}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      const columnsData = await columnsResponse.json().catch(() => []);
      const sortedColumns = Array.isArray(columnsData)
        ? columnsData.sort((a, b) => (a.position || 0) - (b.position || 0))
        : [];
      setColumns(sortedColumns);

      // fetch cards per-column to ensure correct grouping
      await fetchAllCards(token, sortedColumns);
    } catch (err) {
      setError(err.message || "Failed to load board");
    } finally {
      setLoading(false);
    }
  }

  // Fetch cards — prefer per-column endpoints (guarantees proper grouping)
  async function fetchAllCards(token, cols = []) {
    try {
      const cardsByColumn = {};

      if (cols && cols.length > 0) {
        for (const col of cols) {
          const res = await fetch(
            `http://localhost:8080/api/cards/column/${col.id}`,
            {
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            },
          );
          const data = await res.json().catch(() => []);
          cardsByColumn[String(col.id)] = Array.isArray(data) ? data : [];
        }
      } else {
        // fallback to board-wide endpoint
        const cardsResponse = await fetch(
          `http://localhost:8080/api/cards/board/${boardId}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );
        const cardsData = await cardsResponse.json().catch(() => []);
        if (cardsResponse.ok && Array.isArray(cardsData)) {
          cardsData.forEach((card) => {
            const colId =
              card.columnId != null ? String(card.columnId) : "undefined";
            if (!cardsByColumn[colId]) cardsByColumn[colId] = [];
            cardsByColumn[colId].push(card);
          });
        }
      }

      setCards(cardsByColumn);
      console.log("Cards fetched:", cardsByColumn);
    } catch (err) {
      console.error("Error fetching cards:", err);
      setCards({});
    }
  }

  async function saveCard(columnId) {
    if (!cardInput.trim()) return alert("Please enter something for the card");
    setSavingCard(true);
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      const res = await fetch("http://localhost:8080/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: cardInput, columnId, userId, boardId }),
      });
      const created = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(created.message || "Failed to create card");

      // reset and refresh
      setCardInput("");
      setEditingColumnId(null);
      await fetchAllCards(localStorage.getItem("token"), columns);
    } catch (err) {
      alert("Error creating card: " + (err.message || "Unknown"));
    } finally {
      setSavingCard(false);
    }
  }

  function cancelCardEdit() {
    setCardInput("");
    setEditingColumnId(null);
  }

  // COMMENTS
  async function fetchCommentsFor(cardId) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:8080/api/comments/card/${cardId}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      const data = await res.json().catch(() => []);
      setCommentsByCard((p) => ({
        ...p,
        [String(cardId)]: Array.isArray(data) ? data : [],
      }));
    } catch (err) {
      console.error("Error fetching comments for", cardId, err);
      setCommentsByCard((p) => ({ ...p, [String(cardId)]: [] }));
    }
  }

  async function postComment(cardId) {
    const key = String(cardId);
    const content = (commentInputs[key] || "").trim();
    if (!content) return alert("Please enter a comment");

    setPostingCommentCard(key);

    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      const res = await fetch("http://localhost:8080/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ cardId, userId, content }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || "Failed to post comment");

      // Clear input
      setCommentInputs((p) => ({ ...p, [key]: "" }));

      // Refresh comments
      await fetchCommentsFor(cardId);
    } catch (err) {
      alert("Error posting comment: " + (err.message || "Unknown"));
    } finally {
      setPostingCommentCard(null);
    }
  }

  if (loading) return <div className="board-loading">Loading board...</div>;
  if (error)
    return (
      <div className="board-error">
        <p>{error}</p>
        <button onClick={() => navigate("/retroDashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  if (!board)
    return (
      <div className="board-error">
        <p>Board not found</p>
        <button onClick={() => navigate("/retroDashboard")}>
          Back to Dashboard
        </button>
      </div>
    );

  return (
    <div className="board-container">
      <header className="board-header">
        <div className="board-header-left">
          <button
            className="board-back-btn"
            onClick={() => navigate("/retroDashboard")}
          >
            ← Back
          </button>
          <h1 className="board-title">{board.title}</h1>
        </div>
      </header>

      <main className="board-main">
        <div className="board-columns">
          {columns.length > 0 ? (
            columns.map((column) => {
              const colKey = String(column.id);
              const columnCards = cards[colKey] || [];
              return (
                <div key={colKey} className="board-column">
                  <div className="column-header">
                    <h2 className="column-title">
                      {column.title || column.name || "Untitled"}
                    </h2>
                    <button className="column-menu">⋮</button>
                  </div>
                  <div className="column-items">
                    {columnCards.map((card, idx) => {
                      const realId = card.id;
                      const cardKey =
                        realId != null ? String(realId) : `tmp-${idx}`;
                      return (
                        <div key={cardKey} className="card-item">
                          <p className="card-text">{card.content}</p>
                          <div className="card-footer">
                            <button className="vote-btn">
                              👍 {card.votes || 0}
                            </button>
                            <button
                              className="comment-btn"
                              onClick={async () => {
                                if (openCommentsCardKey === cardKey)
                                  return setOpenCommentsCardKey(null);
                                setOpenCommentsCardKey(cardKey);
                                if (realId != null)
                                  await fetchCommentsFor(realId);
                              }}
                            >
                              💬
                            </button>
                          </div>

                          {openCommentsCardKey === cardKey && (
                            <div className="card-comments-section">
                              <div className="comments-list">
                                {(commentsByCard[String(realId)] || []).map(
                                  (c, i) => (
                                    <div
                                      key={c.id || i}
                                      className="comment-item"
                                    >
                                      <div className="comment-content">
                                        {c.message}
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>

                              <textarea
                                className="comment-input"
                                placeholder="Add a comment..."
                                value={commentInputs[String(realId)] || ""}
                                onChange={(e) =>
                                  setCommentInputs((p) => ({
                                    ...p,
                                    [String(realId)]: e.target.value,
                                  }))
                                }
                              />

                              <div className="comment-actions">
                                <button
                                  className="save-card-btn"
                                  onClick={() =>
                                    realId != null && postComment(realId)
                                  }
                                  disabled={
                                    postingCommentCard === String(realId)
                                  }
                                >
                                  {postingCommentCard === String(realId)
                                    ? "Posting..."
                                    : "Post"}
                                </button>

                                <button
                                  className="cancel-card-btn"
                                  onClick={() => setOpenCommentsCardKey(null)}
                                  disabled={
                                    postingCommentCard === String(realId)
                                  }
                                >
                                  Close
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {editingColumnId === column.id ? (
                      <div className="card-input-form">
                        <textarea
                          className="card-textarea"
                          placeholder="Write about how it went..."
                          value={cardInput}
                          onChange={(e) => setCardInput(e.target.value)}
                          autoFocus
                        />
                        <div className="card-form-buttons">
                          <button
                            className="save-card-btn"
                            onClick={() => saveCard(column.id)}
                            disabled={savingCard}
                          >
                            {savingCard ? "Saving..." : "Save"}
                          </button>
                          <button
                            className="cancel-card-btn"
                            onClick={cancelCardEdit}
                            disabled={savingCard}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="add-item-btn"
                        onClick={() => setEditingColumnId(column.id)}
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-columns">No columns available</div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Board;
