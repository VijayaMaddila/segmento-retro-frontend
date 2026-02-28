import { useState, useEffect, useRef } from "react";
import {
  FiThumbsUp,
  FiMessageCircle,
  FiSearch,
  FiChevronDown,
  FiCheck,
} from "react-icons/fi";
import { useParams, useNavigate } from "react-router-dom";
import "./board.css";

const SORT_OPTIONS = [
  { value: "default", label: "Default Order" },
  { value: "votes_desc", label: "Most Votes" },
  { value: "votes_asc", label: "Least Votes" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "az", label: "A → Z" },
  { value: "za", label: "Z → A" },
];

function applySortAndSearch(cards, search, sort) {
  let result = [...cards];
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter((c) => (c.content || "").toLowerCase().includes(q));
  }
  switch (sort) {
    case "votes_desc":
      result.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      break;
    case "votes_asc":
      result.sort((a, b) => (a.votes || 0) - (b.votes || 0));
      break;
    case "newest":
      result.sort((a, b) => (b.id || 0) - (a.id || 0));
      break;
    case "oldest":
      result.sort((a, b) => (a.id || 0) - (b.id || 0));
      break;
    case "az":
      result.sort((a, b) => (a.content || "").localeCompare(b.content || ""));
      break;
    case "za":
      result.sort((a, b) => (b.content || "").localeCompare(a.content || ""));
      break;
    default:
      break;
  }
  return result;
}

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = SORT_OPTIONS.find((o) => o.value === value);

  return (
    <div className="sort-dropdown" ref={ref}>
      <button className="sort-dropdown-btn" onClick={() => setOpen((p) => !p)}>
        {selected?.label || "Sort"} <FiChevronDown size={13} />
      </button>
      {open && (
        <div className="sort-dropdown-menu">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`sort-dropdown-item ${value === opt.value ? "active" : ""}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
              {value === opt.value && <FiCheck size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Board() {
  const { boardId } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [columns, setColumns] = useState([]);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");

  // Add column modal
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);

  const [cardForms, setCardForms] = useState(() => {
    try {
      const saved = localStorage.getItem(`cardForms_${boardId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cards, setCards] = useState({});
  const [savingCard, setSavingCard] = useState(false);

  const [openCommentsCardKey, setOpenCommentsCardKey] = useState(null);
  const [commentsByCard, setCommentsByCard] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [postingCommentCard, setPostingCommentCard] = useState(null);
  const [votesByCard, setVotesByCard] = useState({}); // tracks voted cardIds for current user

  useEffect(() => {
    fetchBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  useEffect(() => {
    try {
      localStorage.setItem(`cardForms_${boardId}`, JSON.stringify(cardForms));
    } catch {}
  }, [cardForms, boardId]);

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
      await fetchAllCards(token, sortedColumns);
    } catch (err) {
      setError(err.message || "Failed to load board");
    } finally {
      setLoading(false);
    }
  }

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
    } catch (err) {
      console.error("Error fetching cards:", err);
      setCards({});
    }
  }

  function addCardForm(columnId) {
    const formId = Date.now() + Math.random();
    setCardForms((prev) => [...prev, { formId, columnId, input: "" }]);
  }

  function updateCardForm(formId, value) {
    setCardForms((prev) =>
      prev.map((f) => (f.formId === formId ? { ...f, input: value } : f)),
    );
  }

  function removeCardForm(formId) {
    setCardForms((prev) => prev.filter((f) => f.formId !== formId));
  }

  async function saveCard(formId, columnId, inputValue) {
    if (!inputValue.trim()) return alert("Please enter something for the card");
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
        body: JSON.stringify({
          content: inputValue,
          columnId,
          userId,
          boardId,
        }),
      });
      const created = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(created.message || "Failed to create card");
      removeCardForm(formId);
      await fetchAllCards(localStorage.getItem("token"), columns);
    } catch (err) {
      alert("Error creating card: " + (err.message || "Unknown"));
    } finally {
      setSavingCard(false);
    }
  }

  async function addColumn() {
    if (!newColumnTitle.trim()) return alert("Please enter a column title");
    setAddingColumn(true);
    try {
      const token = localStorage.getItem("token");
      const position = columns.length;
      const res = await fetch(
        `http://localhost:8080/api/board-columns/${boardId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            boardId: Number(boardId),
            title: newColumnTitle.trim(),
            position,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to add column");
      setNewColumnTitle("");
      setShowAddColumn(false);
      await fetchBoard();
    } catch (err) {
      alert("Error adding column: " + (err.message || "Unknown"));
    } finally {
      setAddingColumn(false);
    }
  }

  async function castVote(cardId) {
    const userId = localStorage.getItem("userId");
    if (!userId) return alert("You must be logged in to vote");

    const key = String(cardId);
    const alreadyVoted = votesByCard[key];

    // Optimistic UI update
    setVotesByCard((p) => ({ ...p, [key]: !alreadyVoted }));
    setCards((prev) => {
      const updated = { ...prev };
      for (const colId in updated) {
        updated[colId] = updated[colId].map((c) =>
          String(c.id) === key
            ? { ...c, votes: (c.votes || 0) + (alreadyVoted ? -1 : 1) }
            : c,
        );
      }
      return updated;
    });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:8080/api/votes/card/${cardId}/user/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            cardId: Number(cardId),
            userId: Number(userId),
          }),
        },
      );
      if (!res.ok) {
        // Revert on failure
        setVotesByCard((p) => ({ ...p, [key]: alreadyVoted }));
        await fetchAllCards(localStorage.getItem("token"), columns);
      }
    } catch (err) {
      // Revert on error
      setVotesByCard((p) => ({ ...p, [key]: alreadyVoted }));
      await fetchAllCards(localStorage.getItem("token"), columns);
      console.error("Vote error:", err);
    }
  }

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
      setCommentInputs((p) => ({ ...p, [key]: "" }));
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

        <div className="board-header-right">
          <button
            className="add-column-btn"
            onClick={() => setShowAddColumn(true)}
          >
            + Add Column
          </button>
          <div className="board-search-wrapper">
            <FiSearch className="board-search-icon" size={14} />
            <input
              className="board-search-input"
              type="text"
              placeholder="Search cards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="board-search-clear"
                onClick={() => setSearch("")}
              >
                ✕
              </button>
            )}
          </div>
          <SortDropdown value={sortBy} onChange={setSortBy} />
        </div>
      </header>

      <main className="board-main">
        <div className="board-columns">
          {columns.length > 0 ? (
            columns.map((column) => {
              const colKey = String(column.id);
              const rawCards = cards[colKey] || [];
              const columnCards = applySortAndSearch(rawCards, search, sortBy);

              return (
                <div key={colKey} className="board-column">
                  <div className="column-header">
                    <h2 className="column-title">
                      {column.title || column.name || "Untitled"}
                    </h2>

                    <button className="column-menu">⋮</button>
                  </div>

                  <div className="column-items">
                    <button
                      className="add-item-btn"
                      onClick={() => addCardForm(column.id)}
                    >
                      +
                    </button>

                    {cardForms
                      .filter((f) => f.columnId === column.id)
                      .map((form) => (
                        <div key={form.formId} className="card-input-form">
                          <textarea
                            className="card-textarea"
                            placeholder="Type something......"
                            value={form.input}
                            onChange={(e) =>
                              updateCardForm(form.formId, e.target.value)
                            }
                            autoFocus
                          />
                          <div className="card-form-buttons">
                            <button
                              className="save-card-btn"
                              onClick={() =>
                                saveCard(form.formId, form.columnId, form.input)
                              }
                              disabled={savingCard}
                            >
                              {savingCard ? "Saving..." : "Save"}
                            </button>
                            <button
                              className="cancel-card-btn"
                              onClick={() => removeCardForm(form.formId)}
                              disabled={savingCard}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))}

                    {columnCards.length === 0 && search && (
                      <div className="no-results">
                        No cards match "{search}"
                      </div>
                    )}

                    {columnCards.map((card, idx) => {
                      const realId = card.id;
                      const cardKey =
                        realId != null ? String(realId) : `tmp-${idx}`;
                      const commentsForCard =
                        commentsByCard[String(realId)] || [];

                      return (
                        <div key={cardKey} className="card-item">
                          <p className="card-text">{card.content}</p>
                          <div className="card-footer">
                            <button
                              className={`vote-btn ${votesByCard[String(realId)] ? "voted" : ""}`}
                              onClick={() => realId != null && castVote(realId)}
                              title={
                                votesByCard[String(realId)]
                                  ? "Remove vote"
                                  : "Vote"
                              }
                            >
                              <FiThumbsUp size={13} />
                              <span>{card.votes || 0}</span>
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
                              <FiMessageCircle size={13} />
                              {commentsForCard.length > 0 && (
                                <span>{commentsForCard.length}</span>
                              )}
                            </button>
                          </div>

                          {openCommentsCardKey === cardKey && (
                            <div className="card-comments-section">
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
                                  className="cancel-card-btn"
                                  onClick={() => setOpenCommentsCardKey(null)}
                                  disabled={
                                    postingCommentCard === String(realId)
                                  }
                                >
                                  ✕
                                </button>
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
                              </div>
                              {commentsForCard.length > 0 && (
                                <div className="comments-list">
                                  {commentsForCard.map((c, i) => (
                                    <div
                                      key={c.id || i}
                                      className="comment-item"
                                    >
                                      <div className="comment-content">
                                        {c.message || c.content}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-columns">No columns available</div>
          )}
        </div>
      </main>
      {showAddColumn && (
        <div className="modal-overlay" onClick={() => setShowAddColumn(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Column</h2>
              <button
                className="modal-close"
                onClick={() => setShowAddColumn(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <label className="modal-label">Column Title</label>
              <input
                className="modal-input"
                type="text"
                placeholder="e.g. Went Well, To Improve..."
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addColumn()}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button
                className="cancel-card-btn"
                onClick={() => {
                  setShowAddColumn(false);
                  setNewColumnTitle("");
                }}
                disabled={addingColumn}
              >
                Cancel
              </button>
              <button
                className="save-card-btn"
                onClick={addColumn}
                disabled={addingColumn}
              >
                {addingColumn ? "Adding..." : "Add Column"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Board;
