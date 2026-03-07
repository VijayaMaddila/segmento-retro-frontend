import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  FiThumbsUp,
  FiMessageCircle,
  FiSearch,
  FiChevronDown,
  FiCheck,
  FiMenu,
  FiX,
  FiPlus,
  FiSliders,
} from "react-icons/fi";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import { useClickOutside } from "../../hooks";
import "./board.css";

const SORT_OPTIONS = [
  { value: "default", label: "Default Order" },
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
  useClickOutside(ref, () => setOpen(false), open);

  const selected = SORT_OPTIONS.find((o) => o.value === value);

  return (
    <div className="sort-dropdown" ref={ref}>
      <button className="sort-dropdown-btn" onClick={() => setOpen((p) => !p)}>
        <FiSliders size={13} />
        <span className="btn-label">{selected?.label || "Sort"}</span>
        <FiChevronDown size={13} />
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

/* ── Mobile Nav Dropdown ── */
function MobileNavMenu({
  onAddColumn,
  search,
  setSearch,
  sortBy,
  setSortBy,
  canManageBoard,
}) {
  const [open, setOpen] = useState(false);
  const [showSortSub, setShowSortSub] = useState(false);
  const ref = useRef(null);

  useClickOutside(ref, () => {
    setOpen(false);
    setShowSortSub(false);
  }, open);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
        setShowSortSub(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const selectedSort = SORT_OPTIONS.find((o) => o.value === sortBy);

  return (
    <div className="mobile-nav-menu" ref={ref}>
      <button
        className={`mobile-menu-btn ${open ? "active" : ""}`}
        onClick={() => {
          setOpen((p) => !p);
          setShowSortSub(false);
        }}
        aria-label="Open menu"
        aria-expanded={open}
      >
        {open ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="mobile-menu-backdrop"
            onClick={() => setOpen(false)}
          />

          <div className="mobile-dropdown">
            {/* Search row */}
            <div className="mobile-dropdown-section">
              <div className="mobile-search-wrapper">
                <FiSearch className="mobile-search-icon" size={14} />
                <input
                  className="mobile-search-input"
                  type="text"
                  placeholder="Search cards..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
                {search && (
                  <button
                    className="mobile-search-clear"
                    onClick={() => setSearch("")}
                  >
                    <FiX size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="mobile-dropdown-divider" />

            {/* Sort sub-menu trigger */}
            <button
              className="mobile-dropdown-item has-sub"
              onClick={() => setShowSortSub((p) => !p)}
            >
              <span className="mobile-item-icon">
                <FiSliders size={15} />
              </span>
              <span className="mobile-item-label">
                Sort: <strong>{selectedSort?.label}</strong>
              </span>
              <FiChevronDown
                size={13}
                className={`mobile-sub-chevron ${showSortSub ? "rotated" : ""}`}
              />
            </button>

            {showSortSub && (
              <div className="mobile-sort-sub">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`mobile-sort-item ${sortBy === opt.value ? "active" : ""}`}
                    onClick={() => {
                      setSortBy(opt.value);
                      setShowSortSub(false);
                    }}
                  >
                    {opt.label}
                    {sortBy === opt.value && <FiCheck size={12} />}
                  </button>
                ))}
              </div>
            )}

            <div className="mobile-dropdown-divider" />

            {/* Add Column */}
            {canManageBoard && (
              <button
                className="mobile-dropdown-item primary"
                onClick={() => {
                  setOpen(false);
                  onAddColumn();
                }}
              >
                <span className="mobile-item-icon">
                  <FiPlus size={15} />
                </span>
                <span className="mobile-item-label">Add Column</span>
              </button>
            )}
          </div>
        </>
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

  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);

  const [editingCardId, setEditingCardId] = useState(null);
  const [editValue, setEditValue] = useState("");

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
  

  const [userVotesByCard, setUserVotesByCard] = useState({}); 
  const [remainingVotes, setRemainingVotes] = useState(6);
  const [cardVoteCounts, setCardVoteCounts] = useState({}); 
  
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentValue, setEditCommentValue] = useState("");

  const [openColumnMenu, setOpenColumnMenu] = useState(null);
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [editColumnTitle, setEditColumnTitle] = useState("");
  const columnMenuRef = useRef(null);

  const [openCardMenu, setOpenCardMenu] = useState(null);
  const cardMenuRef = useRef(null);

  const name = localStorage.getItem("name") || localStorage.getItem("userName") || "User";
  const currentUserId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("role") || "MEMBER";

  const isCreator = board && currentUserId && (
    String(board.userId) === String(currentUserId) ||
    String(board.createdBy?.id) === String(currentUserId) ||
    String(board.createdBy) === String(currentUserId) ||
    String(board.ownerId) === String(currentUserId) ||
    String(board.user_id) === String(currentUserId) ||
    String(board.created_by) === String(currentUserId)
  );

  const canManageBoard = userRole === "ADMIN" || isCreator;

  const closeMenus = useCallback(() => {
    setOpenColumnMenu(null);
    setOpenCardMenu(null);
  }, []);
  const menuRefs = useMemo(() => [columnMenuRef, cardMenuRef], []);
  useClickOutside(menuRefs, closeMenus);

  useEffect(() => {
    fetchBoard();
  }, [boardId]);

  
  useEffect(() => {
    if (board && board.id && Object.keys(cards).length > 0) {
      fetchUserVotingInfo();
    }
  }, [board, cards]);

  useEffect(() => {
    try {
      localStorage.setItem(`cardForms_${boardId}`, JSON.stringify(cardForms));
    } catch {}
  }, [cardForms, boardId]);

  async function fetchBoard() {
    try {
      setLoading(true);
      
      const boardData = await api.get(`/api/boards/${boardId}`);
      setBoard(boardData);

      const columnsData = await api.get(`/api/board-columns/board/${boardId}`);
      const sortedColumns = Array.isArray(columnsData)
        ? columnsData.sort((a, b) => (a.position || 0) - (b.position || 0))
        : [];
      setColumns(sortedColumns);
      await fetchAllCards(sortedColumns);
    } catch (err) {
      setError(err.message || "Failed to load board");
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllCards(cols = []) {
    try {
      const cardsByColumn = {};
      if (cols && cols.length > 0) {
        for (const col of cols) {
          const data = await api.get(`/api/cards/column/${col.id}`);
          cardsByColumn[String(col.id)] = Array.isArray(data) ? data : [];
        }
      } else {
        const cardsData = await api.get(`/api/cards/board/${boardId}`);
        if (Array.isArray(cardsData)) {
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
  async function fetchUserVotingInfo() {
    const userId = localStorage.getItem("userId");
    if (!userId || !boardId) return;

    try {
      const remainingData = await api.get(`/api/votes/board/${boardId}/user/${userId}/remaining`);
      setRemainingVotes(remainingData.remaining || 6);
      const votesData = await api.get(`/api/votes/board/${boardId}`);

      const voteCounts = {};
      const userVoteCounts = {};

      if (Array.isArray(votesData)) {
        votesData.forEach((vote) => {
          const cardId = vote.cardId || vote.card_id;
          if (cardId) {
            voteCounts[cardId] = (voteCounts[cardId] || 0) + 1;
          }
          const voteUserId = vote.userId || vote.user_id;
          if (voteUserId === parseInt(userId, 10) && cardId) {
            userVoteCounts[cardId] = (userVoteCounts[cardId] || 0) + 1;
          }
        });
      }

      setCardVoteCounts(voteCounts);
      setUserVotesByCard(userVoteCounts);
    } catch (err) {
      console.error("Error fetching voting info:", err);
    }
  }
  async function addVote(cardId) {
    const userId = localStorage.getItem("userId");
    if (!userId) return alert("You must be logged in to vote");

    if (remainingVotes <= 0) {
      return alert("You have used all your votes!");
    }
    const cardIdNum = parseInt(cardId, 10);
    const userIdNum = parseInt(userId, 10);
    const boardIdNum = parseInt(boardId, 10);

    try {
      const body = { cardId: cardIdNum, userId: userIdNum, boardId: boardIdNum };

      try {
        await api.post("/api/votes", body);
        setUserVotesByCard((prev) => ({
          ...prev,
          [cardId]: (prev[cardId] || 0) + 1,
        }));
        setRemainingVotes((prev) => prev - 1);
        setCardVoteCounts((prev) => ({
          ...prev,
          [cardId]: (prev[cardId] || 0) + 1,
        }));
      } catch {
        await api.post(`/api/votes/card/${cardIdNum}/user/${userIdNum}`, {
          boardId: boardIdNum,
        });
        setUserVotesByCard((prev) => ({
          ...prev,
          [cardId]: (prev[cardId] || 0) + 1,
        }));
        setRemainingVotes((prev) => prev - 1);
        setCardVoteCounts((prev) => ({
          ...prev,
          [cardId]: (prev[cardId] || 0) + 1,
        }));
      }
    } catch (err) {
      console.error("Error adding vote:", err);
      alert("Failed to add vote: " + err.message);
    }
  }
  async function removeVote(cardId) {
    const userId = localStorage.getItem("userId");
    if (!userId) return alert("You must be logged in to vote");

    const userVoteCount = userVotesByCard[cardId] || 0;
    if (userVoteCount === 0) {
      return alert("You haven't voted on this card");
    }

    const voteData = {
      cardId: parseInt(cardId, 10),
      userId: parseInt(userId, 10),
    };

    try {
      await api.delete("/api/votes", { body: JSON.stringify(voteData) });
      setUserVotesByCard(prev => ({
        ...prev,
        [cardId]: Math.max(0, (prev[cardId] || 0) - 1)
      }));
      setRemainingVotes(prev => prev + 1);
      setCardVoteCounts(prev => ({
        ...prev,
        [cardId]: Math.max(0, (prev[cardId] || 0) - 1)
      }));
    } catch (err) {
      console.error("Error removing vote:", err);
      alert("Failed to remove vote: " + err.message);
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
      const userId = localStorage.getItem("userId");
      const created = await api.post("/api/cards", {
        content: inputValue,
        columnId,
        userId,
        boardId,
      });
      removeCardForm(formId);
      await fetchAllCards(columns);
    } catch (err) {
      alert("Error creating card: " + (err.message || "Unknown"));
    } finally {
      setSavingCard(false);
    }
  }

  async function addColumn() {
    if (!canManageBoard) {
      return alert("Only the board creator or admin can add columns");
    }
    if (!newColumnTitle.trim()) return alert("Please enter a column title");
    setAddingColumn(true);
    try {
      await api.post(`/api/board-columns/${boardId}`, {
        boardId: Number(boardId),
        title: newColumnTitle.trim(),
        position: columns.length,
      });
      
      setNewColumnTitle("");
      setShowAddColumn(false);
      await fetchBoard();
    } catch (err) {
      alert("Error adding column: " + (err.message || "Unknown"));
    } finally {
      setAddingColumn(false);
    }
  }

  async function updateColumn(columnId) {
    if (!canManageBoard) {
      return alert("Only the board creator or admin can edit columns");
    }
    if (!editColumnTitle.trim()) return alert("Column title cannot be empty");

    try {
      await api.put(`/api/board-columns/${columnId}`, {
        title: editColumnTitle.trim(),
      });

      setEditingColumnId(null);
      setEditColumnTitle("");
      setOpenColumnMenu(null);
      await fetchBoard();
    } catch (err) {
      console.error("Error updating column:", err);
      alert("Error updating column: " + (err.message || "Unknown"));
    }
  }

  async function deleteColumn(columnId) {
    if (!canManageBoard) {
      return alert("Only the board creator or admin can delete columns");
    }
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this column? All cards in this column will also be deleted.",
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/board-columns/${columnId}`);
      setColumns((prev) => prev.filter((col) => col.id !== columnId));
      setCards((prev) => {
        const updated = { ...prev };
        delete updated[String(columnId)];
        return updated;
      });
      setOpenColumnMenu(null);
    } catch (err) {
      alert("Error deleting column: " + (err.message || "Unknown"));
    }
  }

  async function fetchCommentsFor(cardId) {
    try {
      const data = await api.get(`/api/comments/card/${cardId}`);
      setCommentsByCard((p) => ({
        ...p,
        [String(cardId)]: Array.isArray(data) ? data : [],
      }));
    } catch {
      setCommentsByCard((p) => ({ ...p, [String(cardId)]: [] }));
    }
  }

  async function postComment(cardId) {
    const key = String(cardId);
    const content = (commentInputs[key] || "").trim();
    if (!content) return alert("Please enter a comment");
    setPostingCommentCard(key);
    try {
      const userId = localStorage.getItem("userId");
      await api.post("/api/comments", { cardId, userId, content });
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

  async function deleteBoard() {
    if (!canManageBoard) {
      return alert("Only the board creator or admin can delete the board");
    }
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this board? All columns and cards will be permanently deleted.",
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/boards/${boardId}`);
      navigate("/retroDashboard");
    } catch (err) {
      alert("Error deleting board: " + (err.message || "Unknown"));
    }
  }

  async function deleteCard(cardId) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this card?",
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/cards/${cardId}`);

      setCards((prev) => {
        const updated = {};
        for (const colId in prev) {
          updated[colId] = prev[colId].filter(
            (c) => String(c.id) !== String(cardId),
          );
        }
        return updated;
      });
    } catch (err) {
      alert("Error deleting card");
    }
  }

  async function updateCard(cardId, columnId) {
    if (!editValue.trim()) return alert("Card cannot be empty");

    try {
      const updatedCard = await api.put(`/api/cards/${cardId}`, {
        content: editValue,
      });

      setCards((prev) => ({
        ...prev,
        [String(columnId)]: prev[String(columnId)].map((card) =>
          card.id === cardId ? { ...card, content: updatedCard.content } : card,
        ),
      }));

      setEditingCardId(null);
      setEditValue("");
    } catch (err) {
      alert("Error updating card");
    }
  }
  async function deleteComment(commentId, cardId) {
    const confirmDelete = window.confirm("Delete this comment?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/comments/${commentId}`);

      setCommentsByCard((prev) => ({
        ...prev,
        [String(cardId)]: prev[String(cardId)].filter(
          (c) => c.id !== commentId,
        ),
      }));
    } catch (err) {
      alert("Error deleting comment");
    }
  }

  async function updateComment(commentId, cardId) {
    if (!editCommentValue.trim()) return alert("Comment cannot be empty");

    try {
      const updatedComment = await api.put(`/api/comments/${commentId}`, {
        content: editCommentValue,
      });

      setCommentsByCard((prev) => ({
        ...prev,
        [String(cardId)]: prev[String(cardId)].map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                content: updatedComment.content,
                message: updatedComment.content,
              }
            : comment,
        ),
      }));

      setEditingCommentId(null);
      setEditCommentValue("");
    } catch (err) {
      alert("Error updating comment");
    }
  }

  return (
    <div className="board-container">
      <header className="board-header">
  
        <div className="mobile-only">
          <MobileNavMenu
            onAddColumn={() => setShowAddColumn(true)}
            search={search}
            setSearch={setSearch}
            sortBy={sortBy}
            setSortBy={setSortBy}
            canManageBoard={canManageBoard}
          />
        </div>

        <div className="board-header-left">
          {userRole === "MEMBER" && (
            <button 
              className="back-to-dashboard-btn"
              onClick={() => navigate('/retroDashboard')}
              title="Back to Dashboard"
            >
              ← Dashboard
            </button>
          )}
          <div className="board-logo">SegmentoRetro</div>
        </div>

        {/* ── Desktop controls (hidden on mobile) ── */}
        <div className="board-header-right desktop-only">
          {canManageBoard && (
            <button
              className="add-column-btn"
              onClick={() => setShowAddColumn(true)}
            >
              <FiPlus size={14} />
              <span className="btn-label">Add Column</span>
            </button>
          )}
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

      {/* Board Title Section */}
      <div className="board-title-section">
        <h1 className="board-page-title">{board.title}</h1>
        <div className="vote-counter">
          <span className="vote-counter-label">Votes Remaining:</span>
          <span className={`vote-counter-value ${remainingVotes === 0 ? 'vote-limit-reached' : ''}`}>
            {remainingVotes} / 6
          </span>
          {remainingVotes === 0 && (
            <span className="vote-counter-warning">⚠️ No votes left</span>
          )}
        </div>
      </div>

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
                    {editingColumnId === column.id ? (
                      <div className="column-edit-form">
                        <input
                          className="column-edit-input"
                          type="text"
                          value={editColumnTitle}
                          onChange={(e) => setEditColumnTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") updateColumn(column.id);
                            if (e.key === "Escape") {
                              setEditingColumnId(null);
                              setEditColumnTitle("");
                            }
                          }}
                          autoFocus
                        />
                        <button
                          className="column-save-btn"
                          onClick={() => updateColumn(column.id)}
                        >
                          ✔
                        </button>
                        <button
                          className="column-cancel-btn"
                          onClick={() => {
                            setEditingColumnId(null);
                            setEditColumnTitle("");
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <h2 className="column-title">
                          {column.title || column.name || "Untitled"}
                        </h2>
                        {canManageBoard && (
                          <div
                            className="column-menu-wrapper"
                            ref={
                              openColumnMenu === column.id
                                ? columnMenuRef
                                : null
                            }
                          >
                            <button
                              className="column-menu"
                              onClick={() =>
                                setOpenColumnMenu(
                                  openColumnMenu === column.id
                                    ? null
                                    : column.id,
                                )
                              }
                            >
                              ⋮
                            </button>
                            {openColumnMenu === column.id && (
                              <div className="column-dropdown-menu">
                                <button
                                  className="column-dropdown-item"
                                  onClick={() => {
                                    setEditingColumnId(column.id);
                                    setEditColumnTitle(
                                      column.title || column.name || "",
                                    );
                                    setOpenColumnMenu(null);
                                  }}
                                >
                                  <span>✎</span> Edit Column
                                </button>
                                <button
                                  className="column-dropdown-item delete"
                                  onClick={() => deleteColumn(column.id)}
                                >
                                  <span>✕</span> Delete Column
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
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
                              {savingCard ? "Saving..." : "✔"}
                            </button>
                            <button
                              className="cancel-card-btn"
                              onClick={() => removeCardForm(form.formId)}
                              disabled={savingCard}
                            >
                              ✕
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
                          <div className="card-header-row">
                            {editingCardId === realId ? (
                              <div className="card-edit-wrapper">
                                <textarea
                                  className="card-textarea"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  autoFocus
                                />
                                <div className="card-form-buttons">
                                  <button
                                    className="save-card-btn"
                                    onClick={() =>
                                      updateCard(realId, column.id)
                                    }
                                  >
                                    ✔
                                  </button>
                                  <button
                                    className="cancel-card-btn"
                                    onClick={() => {
                                      setEditingCardId(null);
                                      setEditValue("");
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="card-text">{card.content}</p>
                                <div
                                  className="card-menu-wrapper"
                                  ref={
                                    openCardMenu === cardKey
                                      ? cardMenuRef
                                      : null
                                  }
                                >
                                  <button
                                    className="card-menu-btn"
                                    onClick={() =>
                                      setOpenCardMenu(
                                        openCardMenu === cardKey
                                          ? null
                                          : cardKey,
                                      )
                                    }
                                  >
                                    ⋮
                                  </button>
                                  {openCardMenu === cardKey && (
                                    <div className="card-dropdown-menu">
                                      <button
                                        className="card-dropdown-item"
                                        onClick={() => {
                                          setEditingCardId(realId);
                                          setEditValue(card.content);
                                          setOpenCardMenu(null);
                                        }}
                                      >
                                        <span>✎</span> Edit Card
                                      </button>
                                      <button
                                        className="card-dropdown-item delete"
                                        onClick={() => {
                                          deleteCard(realId);
                                          setOpenCardMenu(null);
                                        }}
                                      >
                                        <span>✕</span> Delete Card
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          <div className="card-footer">
                            {/* Vote Buttons */}
                            <div className="vote-controls">
                              <button
                                className="vote-btn"
                                onClick={() => realId != null && addVote(realId)}
                                disabled={remainingVotes <= 0}
                                title={remainingVotes <= 0 ? "No votes remaining" : "Add vote"}
                              >
                                <FiThumbsUp size={13} />
                                <span>{cardVoteCounts[realId] || 0}</span>
                              </button>
                              
                              {/* Show remove button if user has voted on this card */}
                              {userVotesByCard[realId] > 0 && (
                                <button
                                  className="remove-vote-btn"
                                  onClick={() => realId != null && removeVote(realId)}
                                  title={`Remove vote (you have ${userVotesByCard[realId]} vote${userVotesByCard[realId] > 1 ? 's' : ''} on this card)`}
                                >
                                  −
                                </button>
                              )}
                            </div>
                            
                            {/* Comment Button */}
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
                                      {editingCommentId === c.id ? (
                                        <div className="comment-edit-form">
                                          <textarea
                                            className="comment-input"
                                            value={editCommentValue}
                                            onChange={(e) =>
                                              setEditCommentValue(
                                                e.target.value,
                                              )
                                            }
                                            autoFocus
                                          />
                                          <div className="comment-actions">
                                            <button
                                              className="cancel-card-btn"
                                              onClick={() => {
                                                setEditingCommentId(null);
                                                setEditCommentValue("");
                                              }}
                                            >
                                              ✕
                                            </button>
                                            <button
                                              className="save-card-btn"
                                              onClick={() =>
                                                updateComment(c.id, realId)
                                              }
                                            >
                                              Save
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="comment-content">
                                            <div>{c.message || c.content}</div>
                                            <div className="comment-written-by">
                                              by
                                              <br />
                                              {name}
                                            </div>
                                          </div>
                                          <div className="comment-buttons">
                                            <button
                                              className="edit-btn"
                                              onClick={() => {
                                                setEditingCommentId(c.id);
                                                setEditCommentValue(
                                                  c.message || c.content,
                                                );
                                              }}
                                              title="Edit comment"
                                            >
                                              ✎
                                            </button>
                                            <button
                                              className="delete-btn"
                                              onClick={() =>
                                                c.id != null &&
                                                deleteComment(c.id, realId)
                                              }
                                              title="Delete comment"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        </>
                                      )}
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

      {/* ── Add Column Modal ── */}
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
