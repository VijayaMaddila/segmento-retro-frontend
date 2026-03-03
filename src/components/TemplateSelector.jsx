import { useState, useEffect } from 'react';
import { templateService } from '../api';
import './TemplateSelector.css';

const CATEGORIES = [
  { value: 'All', label: 'All' },
  { value: 'Retrospective', label: 'Retrospective' },
  { value: 'Design thinking / UX', label: 'Design thinking / UX' },
  { value: 'Team management', label: 'Team management' },
  { value: 'Retrospective', label: 'Retrospective' },
  { value: 'Project management', label: 'Project management' },
  { value: 'Product management', label: 'Product management' },
  { value: 'Team building', label: 'Team building' },
  { value: 'Brainstorm', label: 'Brainstorm' },
  { value: 'Personal', label: 'Personal' },
  { value: 'Icebreakers', label: 'Icebreakers' },
  { value: 'Decision making', label: 'Decision making' },
];

const LANGUAGES = [
  { value: 'All', label: 'All' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
];

function TemplateSelector({ onSelectTemplate, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory, selectedLanguage]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError('');
    
    try {
      let response;
      
      if (selectedCategory !== 'All') {
        response = await templateService.getTemplatesByCategory(selectedCategory);
      } else if (selectedLanguage !== 'All') {
        response = await templateService.getTemplatesByLanguage(selectedLanguage);
      } else {
        response = await templateService.getAllTemplates();
      }

      if (response.ok) {
        setTemplates(response.data);
      } else {
        setError(response.message || 'Failed to load templates');
      }
    } catch (err) {
      setError(err.message || 'Failed to load templates');
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
    setSelectedTemplate(template);
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
    }
  };

  return (
    <div className="template-modal-overlay" onClick={onClose}>
      <div className="template-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="template-modal-header">
          <h2>Create Board</h2>
          <button className="template-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="template-modal-body">
          {/* Left Sidebar */}
          <div className="template-sidebar">
            <div className="template-nav-section">
              <h3>Board info</h3>
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
                  className={`template-category-btn ${selectedCategory === cat.value ? 'active' : ''}`}
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
                  className={`template-language-btn ${selectedLanguage === lang.value ? 'active' : ''}`}
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
                    className={`template-list-item ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                    onClick={() => handleTemplateClick(template)}
                  >
                    <div className="template-list-item-title">{template.title}</div>
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
                  <span className="template-preview-category">{selectedTemplate.category}</span>
                  <span className="template-preview-language">{selectedTemplate.language || 'PT'}</span>
                </div>

                <div className="template-preview-image">
                  {/* Template visual preview */}
                  <div className="template-columns-preview">
                    {selectedTemplate.columns?.map((col, idx) => (
                      <div key={idx} className="template-column-card" style={{
                        background: `hsl(${(idx * 60) % 360}, 70%, 85%)`
                      }}>
                        <div className="template-column-title">{col.name || col.title}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="template-preview-content">
                  <h3>{selectedTemplate.title}</h3>
                  
                  {selectedTemplate.columns && (
                    <ul className="template-preview-list">
                      {selectedTemplate.columns.map((col, idx) => (
                        <li key={idx}>{col.name || col.title}</li>
                      ))}
                    </ul>
                  )}

                  <p className="template-preview-description">
                    {selectedTemplate.description}
                  </p>

                  <div className="template-preview-stats">
                    Used {selectedTemplate.usageCount || 0} times
                  </div>

                  <button className="template-use-btn" onClick={handleUseTemplate}>
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
