import { useState, useEffect } from "react";
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
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "hi", label: "Hindi" },
];

function TemplateSelector({ onSelectTemplate, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    setSelectedTemplate(null); // Clear selected template when filters change
    fetchTemplates();
  }, [selectedCategory, selectedLanguage]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError("");

    try {
      let data;

      console.log("Fetching templates with filters:", {
        selectedCategory,
        selectedLanguage,
      });

      // Both category and language selected
      if (selectedCategory !== "All" && selectedLanguage !== "All") {
        const encodedCategory = encodeURIComponent(selectedCategory);
        const encodedLanguage = encodeURIComponent(selectedLanguage);
        const url = `/api/templates/category/${encodedCategory}/language/${encodedLanguage}`;
        console.log("Fetching URL:", url);
        data = await api.get(url);
      }
      // Only category selected
      else if (selectedCategory !== "All") {
        const encodedCategory = encodeURIComponent(selectedCategory);
        const url = `/api/templates/category/${encodedCategory}`;
        console.log("Fetching URL:", url);
        data = await api.get(url);
      }
      // Only language selected
      else if (selectedLanguage !== "All") {
        const encodedLanguage = encodeURIComponent(selectedLanguage);
        const url = `/api/templates/language/${encodedLanguage}`;
        console.log("Fetching URL:", url);
        data = await api.get(url);
      }
      // No filters - get all templates
      else {
        console.log("Fetching URL: /api/templates");
        data = await api.get("/api/templates");
      }

      console.log("Templates response:", data);
      console.log("Is array?", Array.isArray(data));
      console.log(
        "Length:",
        Array.isArray(data) ? data.length : "not an array",
      );

      setTemplates(Array.isArray(data) ? data : []);

      if (Array.isArray(data) && data.length === 0) {
        console.warn("No templates found for filters:", {
          selectedCategory,
          selectedLanguage,
        });
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
      console.error("Error status:", err.status);
      console.error("Error data:", err.data);

      // Show user-friendly error message
      if (err.status === 401) {
        setError("Please login to view templates");
      } else if (err.status === 404) {
        setError("No templates found for this category");
      } else {
        setError(err.message || "Failed to load templates");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.title?.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query)
    );
  });

  const handleTemplateClick = (template) => {
    console.log("Template clicked:", template);
    console.log("Template columns:", template.columns);
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

          {/* Middle - Template List */}
          <div className="template-list-section">
            {loading && (
              <div className="template-loading-state">
                <div className="spinner" />
                <p>Loading templates...</p>
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

          {/* Right - Template Preview */}
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
                  {/* Template visual preview */}
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
