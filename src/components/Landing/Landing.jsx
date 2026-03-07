import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiCheck, FiZap, FiUsers } from "react-icons/fi";
import TemplateSelector from "../Templates/TemplateSelector";
import "./landing.css";

function Landing() {
  const navigate = useNavigate();
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleAuthAction = (path) => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/retroDashboard");
    } else {
      navigate(path);
    }
  };

  return (
    <div className="landing-page">
      <div className="gradient-bg"></div>

      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">SegmentoRetro</div>
          <div className="nav-actions">
            <button
              className="btn-nav-login"
              onClick={() => handleAuthAction("/login")}
            >
              Sign in
            </button>
            <button
              className="btn-nav-signup"
              onClick={() => handleAuthAction("/register")}
            >
              Try for free
            </button>
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="btn-nav-signup"
            >
              Explore Templates
            </button>
          </div>
        </div>
      </nav>

      {showTemplateSelector && (
        <TemplateSelector
          onClose={() => setShowTemplateSelector(false)}
          onSelectTemplate={(template) => {
            setSelectedTemplate(template);
            setShowTemplateSelector(false);
          }}
        />
      )}

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <h1 className="hero-title">
            Easy online retrospectives for{" "}
            <span className="gradient-text">distributed teams</span>
          </h1>
          <p className="hero-description">
            Run engaging and effective retrospectives with your remote team.
            Simple, intuitive, and built for agile teams who want to improve
            continuously.
          </p>
          <div className="hero-cta">
            <button
              className="btn-hero-primary"
              onClick={() => handleAuthAction("/register")}
            >
              Start a retrospective
              <FiArrowRight size={18} />
            </button>
            <button
              className="btn-hero-secondary"
              onClick={() => handleAuthAction("/login")}
            >
              Sign in
            </button>
          </div>
          {/* Hero Image - Board Preview */}
          <div className="hero-board">
            <div className="board-preview">
              <div className="board-header-preview">
                <div className="board-title-preview">
                  Sprint 24 Retrospective
                </div>
                <div className="board-actions-preview">
                  <div className="action-dot"></div>
                  <div className="action-dot"></div>
                  <div className="action-dot"></div>
                </div>
              </div>
              <div className="board-columns-preview">
                <div className="column-preview column-green">
                  <div className="column-header-preview">
                    <div className="column-icon">😊</div>
                    <div className="column-title">What went well</div>
                  </div>
                  <div className="card-preview"></div>
                  <div className="card-preview"></div>
                  <div className="card-preview"></div>
                </div>
                <div className="column-preview column-yellow">
                  <div className="column-header-preview">
                    <div className="column-icon">💡</div>
                    <div className="column-title">To improve</div>
                  </div>
                  <div className="card-preview"></div>
                  <div className="card-preview"></div>
                </div>
                <div className="column-preview column-blue">
                  <div className="column-header-preview">
                    <div className="column-icon">🎯</div>
                    <div className="column-title">Action items</div>
                  </div>
                  <div className="card-preview"></div>
                  <div className="card-preview"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <h2 className="features-title">
            Everything you need for great retrospectives
          </h2>

          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <FiZap className="feature-icon" />
              </div>
              <div className="feature-content">
                <h3 className="feature-name">Quick to start</h3>
                <p className="feature-text">
                  Create a board in seconds. No signup required to get started.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <FiUsers className="feature-icon" />
              </div>
              <div className="feature-content">
                <h3 className="feature-name">Real-time collaboration</h3>
                <p className="feature-text">
                  Everyone sees updates instantly. Add cards, vote, and discuss
                  together.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <FiCheck className="feature-icon" />
              </div>
              <div className="feature-content">
                <h3 className="feature-name">Simple & intuitive</h3>
                <p className="feature-text">
                  Clean interface that anyone can use. No training needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-section">
        <div className="how-container">
          <h2 className="how-title">How it works</h2>
          <p className="how-subtitle">Get started in minutes, not hours</p>
          <div className="how-steps">
            <div className="how-step">
              <div className="step-number">1</div>
              <h3 className="step-title">Create a board</h3>
              <p className="step-text">
                Choose a template or create your own columns
              </p>
            </div>
            <div className="step-connector"></div>
            <div className="how-step">
              <div className="step-number">2</div>
              <h3 className="step-title">Share the link</h3>
              <p className="step-text">Invite your team with a simple link</p>
            </div>
            <div className="step-connector"></div>
            <div className="how-step">
              <div className="step-number">3</div>
              <h3 className="step-title">Collaborate</h3>
              <p className="step-text">
                Add cards, vote, and create action items
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to improve your retrospectives?</h2>
          <p className="cta-text">
            Join teams using SegmentoRetro to run better retros
          </p>
          <button
            className="btn-cta-primary"
            onClick={() => handleAuthAction("/register")}
          >
            Get started for free
            <FiArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-bottom">
          <p>&copy; 2026 SegmentoRetro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
