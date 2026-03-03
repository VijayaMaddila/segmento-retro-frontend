import { useState, useEffect, useRef } from "react";
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

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setShowSortSub(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close menu on ESC
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
  
  // Voting state
  const [userVotesByCard, setUserVotesByCard] = useState({}); // {cardId: voteCount}
  const [remainingVotes, setRemainingVotes] = useState(6);
  const [cardVoteCounts, setCardVoteCounts] = useState({}); // {cardId: totalCount}
  
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentValue, setEditCommentValue] = useState("");

  const [openColumnMenu, setOpenColumnMenu] = useState(null);
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [editColumnTitle, setEditColumnTitle] = useState("");
  const columnMenuRef = useRef(null);

  const [openCardMenu, setOpenCardMenu] = useState(null);
  const cardMenuRef = useRef(null);

  const name = localStorage.getItem("name" || "userName");
  const currentUserId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("role") || "MEMBER";

  // Check if current user is the board creator OR is an ADMIN
  // Handle both direct ID and nested object cases
  const isCreator = board && currentUserId && (
    String(board.userId) === String(currentUserId) ||
    String(board.createdBy?.id) === String(currentUserId) ||
    String(board.createdBy) === String(currentUserId) ||
    String(board.ownerId) === String(currentUserId) ||
    String(board.user_id) === String(currentUserId) ||
    String(board.created_by) === String(currentUserId)
  );
  
  // ADMIN can do everything on any board
  const canManageBoard = userRole === "ADMIN" || isCreator;

  // Debug logging (remove after testing)
  useEffect(() => {
    if (board) {
      console.log("Board data:", board);
      console.log("Current user ID:", currentUserId);
      console.log("User role:", userRole);
      console.log("Board userId:", board.userId);
      console.log("Board createdBy:", board.createdBy);
      console.log("Board createdBy.id:", board.createdBy?.id);
      console.log("Is creator:", isCreator);
      console.log("Can manage board:", canManageBoard);
    }
  }, [board, currentUserId, isCreator, userRole, canManageBoard]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target)) {
        setOpenColumnMenu(null);
      }
      if (cardMenuRef.current && !cardMenuRef.current.contains(e.target)) {
        setOpenCardMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  // Fetch voting info when board and cards are loaded
  useEffect(() => {
    if (board && board.id && Object.keys(cards).length > 0) {
      fetchUserVotingInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, cards]);

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

  // Fetch user's voting info for the board
  async function fetchUserVotingInfo() {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    if (!userId || !boardId) return;

    console.log("=== FETCHING VOTES ===");
    console.log("BoardId:", boardId, "UserId:", userId);

    try {
      // Get remaining votes
      const remainingRes = await fetch(
        `http://localhost:8080/api/votes/board/${boardId}/user/${userId}/remaining`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      
      console.log("Remaining votes response status:", remainingRes.status);
      
      if (remainingRes.ok) {
        const data = await remainingRes.json();
        console.log("Remaining votes data:", data);
        setRemainingVotes(data.remaining || 6);
      }

      // Get all board votes to update card counts
      const boardVotesRes = await fetch(
        `http://localhost:8080/api/votes/board/${boardId}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      console.log("Board votes response status:", boardVotesRes.status);

      if (boardVotesRes.ok) {
        const votesData = await boardVotesRes.json();
        console.log("Board votes data:", votesData);
        
        const voteCounts = {};
        const userVoteCounts = {};
        
        if (Array.isArray(votesData)) {
          console.log("Processing", votesData.length, "vote records");
          
          votesData.forEach(vote => {
            console.log("Vote record:", vote);
            
            // Count total votes per card
            const cardId = vote.cardId || vote.card_id;
            if (cardId) {
              voteCounts[cardId] = (voteCounts[cardId] || 0) + 1;
            }
            
            // Count user's votes per card
            const voteUserId = vote.userId || vote.user_id;
            if (voteUserId === parseInt(userId, 10) && cardId) {
              userVoteCounts[cardId] = (userVoteCounts[cardId] || 0) + 1;
            }
          });
          
          console.log("Final vote counts:", voteCounts);
          console.log("Final user vote counts:", userVoteCounts);
        } else {
          console.warn("Votes data is not an array:", votesData);
        }
        
        setCardVoteCounts(voteCounts);
        setUserVotesByCard(userVoteCounts);
      } else {
        const errorText = await boardVotesRes.text();
        console.error("Failed to fetch board votes:", errorText);
      }
      
      console.log("=== END FETCHING VOTES ===");
    } catch (err) {
      console.error("Error fetching voting info:", err);
    }
  }

  // Add vote to a card (can vote multiple times)
  async function addVote(cardId) {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    if (!userId) return alert("You must be logged in to vote");

    if (remainingVotes <= 0) {
      return alert("You have used all your votes!");
    }

    // Ensure all IDs are numbers
    const cardIdNum = parseInt(cardId, 10);
    const userIdNum = parseInt(userId, 10);
    const boardIdNum = parseInt(boardId, 10);

    console.log("=== VOTE DEBUG ===");
    console.log("CardId:", cardIdNum, "UserId:", userIdNum, "BoardId:", boardIdNum);
    console.log("Token present:", !!token);

    // Try different endpoint formats based on backend documentation
    // Format 1: POST /api/votes with body
    const url1 = `http://localhost:8080/api/votes`;
    const body1 = { cardId: cardIdNum, userId: userIdNum, boardId: boardIdNum };
    
    // Format 2: POST /api/votes/card/{cardId}/user/{userId} (from earlier backend docs)
    const url2 = `http://localhost:8080/api/votes/card/${cardIdNum}/user/${userIdNum}`;
    const body2 = { boardId: boardIdNum };

    // Try Format 1 first
    console.log("Trying Format 1 - URL:", url1);
    console.log("Trying Format 1 - Body:", body1);

    try {
      let res = await fetch(url1, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body1),
      });

      console.log("Format 1 response status:", res.status);

      // If Format 1 fails with 400 or 404, try Format 2
      if (!res.ok && (res.status === 400 || res.status === 404)) {
        console.log("Format 1 failed, trying Format 2 - URL:", url2);
        console.log("Format 2 - Body:", body2);
        
        res = await fetch(url2, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body2),
        });
        
        console.log("Format 2 response status:", res.status);
      }

      // Get response text
      const responseText = await res.text();
      console.log("Vote response body:", responseText);

      if (res.ok) {
        let data = {};
        try {
          data = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
          console.log("Response is not JSON, treating as success");
        }
        console.log("Vote added successfully:", data);
        
        // Update local state - increment counts
        setUserVotesByCard(prev => ({
          ...prev,
          [cardId]: (prev[cardId] || 0) + 1
        }));
        setRemainingVotes(prev => prev - 1);
        setCardVoteCounts(prev => ({
          ...prev,
          [cardId]: (prev[cardId] || 0) + 1
        }));
      } else {
        console.error("Vote failed - Status:", res.status);
        console.error("Vote failed - Response:", responseText);
        
        // Try to parse error message
        let errorMessage = `Failed to add vote (${res.status})`;
        try {
          const error = JSON.parse(responseText);
          console.error("Vote failed - Parsed error:", error);
          errorMessage = error.message || error.error || errorMessage;
        } catch {
          if (responseText) {
            errorMessage = responseText;
          }
        }
        
        alert(errorMessage);
      }
      console.log("=== END VOTE DEBUG ===");
    } catch (err) {
      console.error("Error adding vote:", err);
      console.error("Error stack:", err.stack);
      alert("Failed to add vote: " + err.message);
    }
  }

  // Remove one vote from a card
  async function removeVote(cardId) {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    if (!userId) return alert("You must be logged in to vote");

    const userVoteCount = userVotesByCard[cardId] || 0;
    if (userVoteCount === 0) {
      return alert("You haven't voted on this card");
    }

    // Ensure all IDs are numbers
    const voteData = {
      cardId: parseInt(cardId, 10),
      userId: parseInt(userId, 10),
    };

    console.log("Removing vote:", voteData);

    try {
      const res = await fetch(`http://localhost:8080/api/votes`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(voteData),
      });

      console.log("Remove vote response status:", res.status);

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        console.log("Vote removed successfully:", data);
        
        // Update local state - decrement counts
        setUserVotesByCard(prev => ({
          ...prev,
          [cardId]: Math.max(0, (prev[cardId] || 0) - 1)
        }));
        setRemainingVotes(prev => prev + 1);
        setCardVoteCounts(prev => ({
          ...prev,
          [cardId]: Math.max(0, (prev[cardId] || 0) - 1)
        }));
      } else {
        const error = await res.json().catch(() => ({ message: "Unknown error" }));
        console.error("Remove vote failed:", error);
        alert(error.message || "Failed to remove vote");
      }
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
    if (!canManageBoard) {
      return alert("Only the board creator or admin can add columns");
    }
    if (!newColumnTitle.trim()) return alert("Please enter a column title");
    setAddingColumn(true);
    try {
      const token = localStorage.getItem("token");
      
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
            position: columns.length,
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

  async function updateColumn(columnId) {
    if (!canManageBoard) {
      return alert("Only the board creator or admin can edit columns");
    }
    if (!editColumnTitle.trim()) return alert("Column title cannot be empty");

    try {
      const token = localStorage.getItem("token");

      const requestBody = {
        title: editColumnTitle.trim(),
      };

      console.log("Sending update request:", requestBody);

      const res = await fetch(
        `http://localhost:8080/api/board-columns/${columnId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(requestBody),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Update column error:", data);
        throw new Error(data.message || "Update failed");
      }

      console.log("Column updated successfully:", data);
      console.log("Title in response:", data.title);

      setEditingColumnId(null);
      setEditColumnTitle("");
      setOpenColumnMenu(null);

      // Refetch board to ensure UI is in sync
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
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:8080/api/board-columns/${columnId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (!res.ok) throw new Error("Delete failed");

      // Remove column from UI instantly
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

  async function deleteBoard() {
    if (!canManageBoard) {
      return alert("Only the board creator or admin can delete the board");
    }
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this board? All columns and cards will be permanently deleted.",
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/boards/${boardId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete board");
      }

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
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:8080/api/cards/${cardId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error("Failed to delete");

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
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:8080/api/cards/${cardId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: editValue,
        }),
      });

      if (!res.ok) throw new Error("Update failed");

      const updatedCard = await res.json();

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
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:8080/api/comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (!res.ok) throw new Error("Delete failed");

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
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:8080/api/comments/${commentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            content: editCommentValue,
          }),
        },
      );

      if (!res.ok) throw new Error("Update failed");

      const updatedComment = await res.json();

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
        {/* ── Mobile hamburger menu (left side on mobile) ── */}
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
