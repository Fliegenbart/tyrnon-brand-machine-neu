import React, { useState } from 'react';

const previewModes = [
  { id: 'web', label: 'Web' },
  { id: 'print', label: 'Print' },
  { id: 'ppt', label: 'PPT' },
];

export default function TokenPreview({ brand, activeTab }) {
  const [previewMode, setPreviewMode] = useState('web');

  return (
    <div className="token-preview">
      <div className="preview-header">
        <h4>Live Preview</h4>
        <div className="preview-mode-switcher">
          {previewModes.map(mode => (
            <button
              key={mode.id}
              className={`preview-mode-btn ${previewMode === mode.id ? 'active' : ''}`}
              onClick={() => setPreviewMode(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`preview-content preview-${previewMode}`}>
        {previewMode === 'web' && (
          <div className="web-preview">
            <div
              className="web-preview-frame"
              style={{
                backgroundColor: brand.colors.background,
                color: brand.colors.text,
                fontFamily: brand.fonts.body
              }}
            >
              <header
                className="web-header"
                style={{ borderBottom: `1px solid ${brand.colors.primary}20` }}
              >
                <div className="web-logo" style={{ color: brand.colors.primary }}>
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.name} />
                  ) : (
                    brand.name
                  )}
                </div>
                <nav className="web-nav">
                  <span>Produkte</span>
                  <span>Über uns</span>
                  <span>Kontakt</span>
                </nav>
              </header>

              <main className="web-main">
                <h1 style={{ fontFamily: brand.fonts.heading, color: brand.colors.text }}>
                  {brand.voice?.tagline || 'Willkommen bei ' + brand.name}
                </h1>
                <p style={{ color: brand.colors.text + 'cc' }}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Sed do eiusmod tempor incididunt ut labore.
                </p>
                <button
                  className="web-cta"
                  style={{
                    backgroundColor: brand.colors.primary,
                    color: brand.colors.background
                  }}
                >
                  Mehr erfahren
                </button>
              </main>

              <div className="web-cards">
                {['Feature 1', 'Feature 2', 'Feature 3'].map((feature, i) => (
                  <div
                    key={i}
                    className="web-card"
                    style={{
                      backgroundColor: brand.colors.background,
                      border: `1px solid ${brand.colors.secondary}20`
                    }}
                  >
                    <div
                      className="card-icon"
                      style={{ backgroundColor: brand.colors.primary + '20', color: brand.colors.primary }}
                    >
                      ◆
                    </div>
                    <h3 style={{ fontFamily: brand.fonts.heading }}>{feature}</h3>
                    <p>Kurze Beschreibung des Features.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {previewMode === 'print' && (
          <div className="print-preview">
            <div
              className="print-frame"
              style={{
                backgroundColor: '#ffffff',
                fontFamily: brand.fonts.body
              }}
            >
              <div
                className="print-header"
                style={{ backgroundColor: brand.colors.primary }}
              >
                {brand.logo && (
                  <img src={brand.logo} alt={brand.name} className="print-logo" />
                )}
              </div>
              <div className="print-content">
                <h1 style={{ fontFamily: brand.fonts.heading, color: brand.colors.text }}>
                  Headline hier
                </h1>
                <p style={{ color: brand.colors.text }}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Vestibulum ante ipsum primis in faucibus.
                </p>
                <div
                  className="print-accent"
                  style={{ backgroundColor: brand.colors.accent }}
                />
              </div>
              <div
                className="print-footer"
                style={{
                  backgroundColor: brand.colors.secondary,
                  color: brand.colors.background
                }}
              >
                <span>{brand.name}</span>
                <span>www.example.com</span>
              </div>
            </div>
            <div className="print-specs">
              <h5>Print Specs</h5>
              <ul>
                <li>Format: A4 / A5</li>
                <li>Beschnitt: 3mm</li>
                <li>Farbraum: CMYK</li>
              </ul>
            </div>
          </div>
        )}

        {previewMode === 'ppt' && (
          <div className="ppt-preview">
            <div
              className="ppt-slide"
              style={{
                backgroundColor: brand.colors.background,
                fontFamily: brand.fonts.body
              }}
            >
              <div
                className="ppt-title-bar"
                style={{ backgroundColor: brand.colors.primary }}
              />
              <div className="ppt-content">
                <h1 style={{ fontFamily: brand.fonts.heading, color: brand.colors.text }}>
                  Präsentationstitel
                </h1>
                <h2 style={{ color: brand.colors.secondary }}>
                  Untertitel der Präsentation
                </h2>
                <div className="ppt-bullets">
                  <div className="ppt-bullet">
                    <span style={{ color: brand.colors.primary }}>●</span>
                    <span>Erster Aufzählungspunkt</span>
                  </div>
                  <div className="ppt-bullet">
                    <span style={{ color: brand.colors.primary }}>●</span>
                    <span>Zweiter Aufzählungspunkt</span>
                  </div>
                  <div className="ppt-bullet">
                    <span style={{ color: brand.colors.primary }}>●</span>
                    <span>Dritter Aufzählungspunkt</span>
                  </div>
                </div>
              </div>
              {brand.logo && (
                <img src={brand.logo} alt="" className="ppt-logo" />
              )}
            </div>
            <div className="ppt-info">
              <span>16:9 Slide</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
