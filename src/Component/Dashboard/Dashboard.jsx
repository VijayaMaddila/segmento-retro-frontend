import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [boardTitle, setBoardTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState([]);
  const [templatesError, setTemplatesError] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateList, setShowTemplateList] = useState(false);

  async function handleCreateBoard(event) {
    event.preventDefault();
    setError('');
    setCreating(true);

    try {
      const token = localStorage.getItem('token');
      const storedUserId = localStorage.getItem('userId');
      const userId = storedUserId ? Number(storedUserId) : undefined;

      const response = await fetch('http://localhost:8080/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: boardTitle,
          templateId: selectedTemplate ? selectedTemplate.id : null,
          userId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create board');
      }

  
      setBoardTitle('');
      setSelectedTemplate(null);
      setShowCreateBoard(false);
      
      
      if (data.id) {
        navigate(`/board/${data.id}`);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setCreating(false);
    }
  }

  async function ensureTemplatesLoaded() {
    if (loadingTemplates || templates.length > 0) {
      return;
    }

    try {
      setLoadingTemplates(true);
      setTemplatesError('');
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/templates', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load templates');
      }

      const list = Array.isArray(data) ? data : [];
      setTemplates(list);

      
      if (!selectedTemplate && list.length > 0) {
        setSelectedTemplate(list[0]);
      }
    } catch (err) {
      setTemplatesError(err.message || 'Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  }

  useEffect(() => {
    if (!showCreateBoard) return;
    ensureTemplatesLoaded();
  }, [showCreateBoard]);

  return (
    <div className="app dashboard-app">
      <header className="dash-navbar">
        <div className="dash-nav-left">
          <span className="dash-logo">SegmentoRetro</span>
        </div>

       <div className='nave-bar'>
         <nav className="dash-nav-center">
          <button className="dash-tab active">Dashboard</button>
          <button className="dash-tab">Teams</button>
          <button className="dash-tab">Analytics</button>
          <button className="dash-tab">Action items</button>
          <button className="dash-tab">Integrations</button>
          <button className="dash-tab">Subscription</button>
        </nav>
        </div>

        
      </header>

      <main className="dash-main">
        <h1 className="dash-page-title">Dashboard</h1>

        <section className="dash-content">
          <button
            type="button"
            className="dash-board-card dashed dash-add-board-button"
            onClick={() => setShowCreateBoard(true)}
          >
            <div className="dash-add-board-plus">+</div>
            <div className="dash-add-board-text">Add board</div>
          </button>
        </section>
      </main>

      {showCreateBoard && (
        <div
          className="board-modal-backdrop"
          onClick={() => !creating && setShowCreateBoard(false)}
        >
          <div
            className="board-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="board-modal-header">
              <h2>Create Board</h2>
              <button
                type="button"
                className="board-modal-close"
                onClick={() => setShowCreateBoard(false)}
                disabled={creating}
              >
                ×
              </button>
            </header>

            <form className="board-modal-body" onSubmit={handleCreateBoard}>
              <label className="board-field">
                <span className="board-label">Name</span>
                <input
                  type="text"
                  placeholder="Type your board name"
                  value={boardTitle}
                  onChange={(event) => setBoardTitle(event.target.value)}
                  required
                />
              </label>

              <div className="board-template-block">
                <div className="board-label">Template</div>
                <div className="board-template-chip">
                  {selectedTemplate
                    ? selectedTemplate.title || selectedTemplate.name
                    : 'Went Well - To Improve - Action Items'}
                </div>
                <div className="board-template-links">
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      setShowTemplateList((prev) => !prev);
                      ensureTemplatesLoaded();
                    }}
                  >
                    Change template
                  </button>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      
                      setShowTemplateList(true);
                      ensureTemplatesLoaded();
                    }}
                  >
                    Use custom template
                  </button>
                </div>

                {showTemplateList && (
                  <div className="board-template-list">
                    {loadingTemplates && (
                      <div className="board-template-list-item muted">
                        Loading templates...
                      </div>
                    )}
                    {templatesError && !loadingTemplates && (
                      <div className="board-template-list-item error">
                        {templatesError}
                      </div>
                    )}
                    {!loadingTemplates &&
                      !templatesError &&
                      templates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          className="board-template-list-item"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowTemplateList(false);
                          }}
                        >
                          {template.title || template.name || `Template ${template.id}`}
                        </button>
                      ))}
                    {!loadingTemplates && !templatesError && templates.length === 0 && (
                      <div className="board-template-list-item muted">
                        No templates available
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button type="button" className="board-config-toggle">
                Show configuration ▾
              </button>

              {error ? <p className="board-error">{error}</p> : null}

              <footer className="board-modal-footer">
                <button
                  type="submit"
                  className="board-primary"
                  disabled={creating}
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
                <button
                  type="button"
                  className="board-secondary"
                  onClick={() => setShowCreateBoard(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

