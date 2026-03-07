import { useState, useEffect, useMemo } from "react";
import api from "../../api";
import "./TemplateSelector.css";

const CATEGORIES = [
  { value: "All", label: "All" },
  { value: "Classic", label: "Classic" },
  { value: "Team Management", label: "Team Management" },
  { value: "Team Building", label: "Team Building" },
  { value: "Project Management", label: "Project Management" },
  { value: "Product Management", label: "Product Management" },
  { value: "Personal", label: "Personal" },
  { value: "Icebreakers", label: "Icebreakers" },
  { value: "Decision Making", label: "Decision Making" },
];

const LANGUAGES = [
  { value: "All", label: "All" },
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
];

function TemplateSelector({ onSelectTemplate, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Fetch all templates once on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/templates"); // Fetch all templates
      setTemplates(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching templates:", err);
      const status = err.response?.status;
      if (status === 401) {
        setError("Please login to view templates");
      } else if (status === 404) {
        setError("No templates found");
      } else {
        setError(err.message || "Failed to load templates");
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter templates locally
  const filteredTemplates = useMemo(() => {
    return templates
      .filter(
        (t) => selectedCategory === "All" || t.category === selectedCategory,
      )
      .filter(
        (t) => selectedLanguage === "All" || t.language === selectedLanguage,
      )
      .filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
        );
      });
  }, [templates, selectedCategory, selectedLanguage, searchQuery]);

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
    }
  };

  return (
    <div className="template-modal-overlay" onClick={onClose}>
      <div
        className="template-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="template-modal-header">
          <h2>Create Board</h2>
          <button className="template-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="template-modal-body">
          {/* Sidebar */}
          <div className="template-sidebar">
            <div className="template-nav-section">
              <h3>Template info</h3>
              <button className="template-nav-item active">
                Choose existing template
              </button>
            </div>

            <div className="template-filter-section">
              <input
                type="text"
                placeholder="Filter the templates"
                className="template-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="template-count">
                {filteredTemplates.length} templates found
              </div>
            </div>

            <div className="template-categories">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  className={`template-category-btn ${selectedCategory === cat.value ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="template-languages">
              <h4>Languages</h4>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  className={`template-language-btn ${selectedLanguage === lang.value ? "active" : ""}`}
                  onClick={() => setSelectedLanguage(lang.value)}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Template List */}
          <div className="template-list-section">
            {loading && (
              <div className="template-loading-state">
                <div className="spinner" />
              </div>
            )}

            {error && (
              <div className="template-error-state">
                <p>{error}</p>
                <button onClick={fetchTemplates}>Retry</button>
              </div>
            )}

            {!loading && !error && filteredTemplates.length === 0 && (
              <div className="template-empty-state">
                <p>No templates found</p>
              </div>
            )}

            {!loading && !error && filteredTemplates.length > 0 && (
              <div className="template-list">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`template-list-item ${selectedTemplate?.id === template.id ? "selected" : ""}`}
                    onClick={() => handleTemplateClick(template)}
                  >
                    <div className="template-list-item-title">
                      {template.title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Template Preview */}
          <div className="template-preview-section">
            {selectedTemplate ? (
              <>
                <div className="template-preview-header">
                  <span className="template-preview-category">
                    {selectedTemplate.category}
                  </span>
                  <span className="template-preview-language">
                    {selectedTemplate.language || "PT"}
                  </span>
                </div>

                <div className="template-preview-image">
                  <div className="template-columns-preview">
                    {selectedTemplate.columns?.slice(0, 10).map((col, idx) => (
                      <div
                        key={idx}
                        className="template-column-card"
                        style={{
                          background: `hsl(${(idx * 60) % 360}, 70%, 85%)`,
                        }}
                      >
                        <div className="template-column-title">
                          {col.name || col.title}
                        </div>
                      </div>
                    ))}
                    {selectedTemplate.columns?.length > 10 && (
                      <div
                        className="template-column-card"
                        style={{ background: "#f0f0f0" }}
                      >
                        <div className="template-column-title">
                          +{selectedTemplate.columns.length - 10} more
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="template-preview-content">
                  <h3>{selectedTemplate.title}</h3>
                  {selectedTemplate.columns && (
                    <>
                      <ul className="template-preview-list">
                        {selectedTemplate.columns
                          .slice(0, 10)
                          .map((col, idx) => (
                            <li key={idx}>{col.name || col.title}</li>
                          ))}
                      </ul>
                      {selectedTemplate.columns.length > 10 && (
                        <p
                          style={{
                            color: "#999",
                            fontSize: "12px",
                            marginTop: "8px",
                          }}
                        >
                          ... and {selectedTemplate.columns.length - 10} more
                          columns
                        </p>
                      )}
                    </>
                  )}
                  <p className="template-preview-description">
                    {selectedTemplate.description}
                  </p>
                  <div className="template-preview-stats">
                    Used {selectedTemplate.usageCount || 0} times
                  </div>
                  <button
                    className="template-use-btn"
                    onClick={handleUseTemplate}
                    disabled={!selectedTemplate}
                  >
                    Use template
                  </button>
                </div>
              </>
            ) : (
              <div className="template-preview-empty">
                <p>Select a template to see details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplateSelector;
