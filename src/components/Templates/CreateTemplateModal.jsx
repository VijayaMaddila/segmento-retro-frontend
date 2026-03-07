import { useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import api from "../../api";
import "../Dashboard/dashboard.css";

const CATEGORIES = [
  "Retrospective",
  "Brainstorm",
  "Team building",
  "Design thinking / UX",
  "Project management",
  "Product management",
  "Icebreakers",
  "Personal",
  "Decision making",
];

const LANGUAGES = ["English", "Portuguese", "Spanish", "French"];

export default function CreateTemplateModal({ onClose, onCreated }) {
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Retrospective");
  const [language, setLanguage] = useState("English");
  const [columns, setColumns] = useState([
    { uid: 1, name: "" },
    { uid: 2, name: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addColumn() {
    setColumns((p) => [...p, { uid: Date.now() + Math.random(), name: "" }]);
  }

  function removeColumn(uid) {
    if (columns.length <= 1) return;
    setColumns((p) => p.filter((c) => c.uid !== uid));
  }

  function updateColumn(uid, value) {
    setColumns((p) =>
      p.map((c) => (c.uid === uid ? { ...c, name: value } : c))
    );
  }

  async function handleSave() {
    setError("");
    if (!templateName.trim()) return setError("Please enter a template name.");
    if (!description.trim()) return setError("Please enter a description.");
    const filled = columns.filter((c) => c.name.trim());
    if (!filled.length) return setError("Please add at least one column.");
    setSaving(true);
    try {
      const data = await api.post("/api/templates", {
        title: templateName.trim(),
        description: description.trim(),
        category,
        language,
        columns: filled.map((c, i) => ({ name: c.name.trim(), position: i })),
      });
      onCreated(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 className="modal-title">Create Custom Template</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="modal-body">
          <label className="field-group">
            <span className="field-label">Template Name</span>
            <input
              className="field-input"
              type="text"
              placeholder="e.g. Sprint Retro, Team Health..."
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              autoFocus
            />
          </label>

          <label className="field-group">
            <span className="field-label">Description</span>
            <textarea
              className="field-input"
              rows="3"
              placeholder="Describe what this template is for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="field-group">
            <span className="field-label">Category</span>
            <select
              className="field-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label className="field-group">
            <span className="field-label">Language</span>
            <select
              className="field-input"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </label>

          <div className="field-group">
            <span className="field-label">Columns</span>
            <div className="tpl-columns-list">
              {columns.map((col, idx) => (
                <div key={col.uid} className="tpl-column-row">
                  <span className="tpl-column-index">{idx + 1}</span>
                  <input
                    className="field-input tpl-column-input"
                    type="text"
                    placeholder={`Column ${idx + 1} name`}
                    value={col.name}
                    onChange={(e) => updateColumn(col.uid, e.target.value)}
                  />
                  <button
                    className="icon-btn icon-btn--danger"
                    onClick={() => removeColumn(col.uid)}
                    disabled={columns.length <= 1}
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <button
              className="link-btn"
              style={{ marginTop: 6 }}
              onClick={addColumn}
            >
              <FiPlus
                size={12}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Add column
            </button>
          </div>

          {error && <p className="field-error">{error}</p>}

          <footer className="modal-footer">
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Creating…" : "Create Template"}
            </button>
            <button
              className="btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
