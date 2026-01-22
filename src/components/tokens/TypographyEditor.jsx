import React, { useState } from 'react';

const popularFonts = [
  { name: 'Inter', category: 'Sans-Serif', weights: [400, 500, 600, 700] },
  { name: 'Space Grotesk', category: 'Sans-Serif', weights: [400, 500, 600, 700] },
  { name: 'DM Sans', category: 'Sans-Serif', weights: [400, 500, 600, 700] },
  { name: 'Poppins', category: 'Sans-Serif', weights: [400, 500, 600, 700] },
  { name: 'Outfit', category: 'Sans-Serif', weights: [400, 500, 600, 700] },
  { name: 'Plus Jakarta Sans', category: 'Sans-Serif', weights: [400, 500, 600, 700, 800] },
  { name: 'Manrope', category: 'Sans-Serif', weights: [400, 500, 600, 700, 800] },
  { name: 'Sora', category: 'Sans-Serif', weights: [400, 500, 600, 700] },
  { name: 'Work Sans', category: 'Sans-Serif', weights: [400, 500, 600, 700] },
  { name: 'Lora', category: 'Serif', weights: [400, 500, 600, 700] },
  { name: 'Playfair Display', category: 'Serif', weights: [400, 500, 600, 700] },
  { name: 'Fraunces', category: 'Serif', weights: [400, 500, 600, 700] },
  { name: 'Cormorant', category: 'Serif', weights: [400, 500, 600, 700] },
  { name: 'Source Serif 4', category: 'Serif', weights: [400, 500, 600, 700] },
  { name: 'JetBrains Mono', category: 'Mono', weights: [400, 500, 600, 700] },
  { name: 'Fira Code', category: 'Mono', weights: [400, 500, 600, 700] },
];

const typographyScale = [
  { name: '7xl', size: 72, lineHeight: 1.0, use: 'Hero Headlines' },
  { name: '6xl', size: 60, lineHeight: 1.0, use: 'Large Headlines' },
  { name: '5xl', size: 48, lineHeight: 1.1, use: 'Section Headlines' },
  { name: '4xl', size: 36, lineHeight: 1.1, use: 'Card Headlines' },
  { name: '3xl', size: 30, lineHeight: 1.2, use: 'Subheadlines' },
  { name: '2xl', size: 24, lineHeight: 1.3, use: 'Large Text' },
  { name: 'xl', size: 20, lineHeight: 1.4, use: 'Lead Text' },
  { name: 'lg', size: 18, lineHeight: 1.5, use: 'Large Body' },
  { name: 'base', size: 16, lineHeight: 1.6, use: 'Body Text' },
  { name: 'sm', size: 14, lineHeight: 1.5, use: 'Small Text' },
  { name: 'xs', size: 12, lineHeight: 1.5, use: 'Captions' },
];

export default function TypographyEditor({ fonts, onChange }) {
  const [activeSection, setActiveSection] = useState('heading');

  const extractFontName = (fontString) => {
    const match = fontString.match(/'([^']+)'/);
    return match ? match[1] : fontString.split(',')[0].trim();
  };

  const handleFontChange = (type, fontName) => {
    const fallback = type === 'heading'
      ? ", -apple-system, BlinkMacSystemFont, sans-serif"
      : ", -apple-system, BlinkMacSystemFont, sans-serif";
    onChange({ ...fonts, [type]: `'${fontName}'${fallback}` });
  };

  const currentHeading = extractFontName(fonts.heading);
  const currentBody = extractFontName(fonts.body);

  // Load Google Fonts dynamically
  React.useEffect(() => {
    const fontsToLoad = [currentHeading, currentBody].filter(f => f);
    if (fontsToLoad.length > 0) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontsToLoad.map(f => f.replace(/ /g, '+')).join('&family=')}&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [currentHeading, currentBody]);

  return (
    <div className="typography-editor">
      <h3>Typografie</h3>
      <p className="editor-description">
        Wähle Schriften für Headlines und Body Text. Die Type Scale wird automatisch generiert.
      </p>

      <div className="font-sections">
        <div className={`font-section ${activeSection === 'heading' ? 'active' : ''}`}>
          <div
            className="font-section-header"
            onClick={() => setActiveSection(activeSection === 'heading' ? null : 'heading')}
          >
            <div className="font-preview-mini">
              <span style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 24 }}>
                Aa
              </span>
            </div>
            <div className="font-section-info">
              <span className="font-section-label">Heading Font</span>
              <span className="font-section-value">{currentHeading}</span>
            </div>
            <span className="expand-icon">{activeSection === 'heading' ? '−' : '+'}</span>
          </div>

          {activeSection === 'heading' && (
            <div className="font-section-content">
              <div className="font-grid">
                {popularFonts.filter(f => f.category !== 'Mono').map(font => (
                  <button
                    key={font.name}
                    className={`font-option ${currentHeading === font.name ? 'selected' : ''}`}
                    onClick={() => handleFontChange('heading', font.name)}
                  >
                    <span
                      className="font-option-preview"
                      style={{ fontFamily: `'${font.name}', sans-serif`, fontWeight: 700 }}
                    >
                      Headline
                    </span>
                    <span className="font-option-name">{font.name}</span>
                    <span className="font-option-category">{font.category}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={`font-section ${activeSection === 'body' ? 'active' : ''}`}>
          <div
            className="font-section-header"
            onClick={() => setActiveSection(activeSection === 'body' ? null : 'body')}
          >
            <div className="font-preview-mini">
              <span style={{ fontFamily: fonts.body, fontSize: 16 }}>
                Aa
              </span>
            </div>
            <div className="font-section-info">
              <span className="font-section-label">Body Font</span>
              <span className="font-section-value">{currentBody}</span>
            </div>
            <span className="expand-icon">{activeSection === 'body' ? '−' : '+'}</span>
          </div>

          {activeSection === 'body' && (
            <div className="font-section-content">
              <div className="font-grid">
                {popularFonts.map(font => (
                  <button
                    key={font.name}
                    className={`font-option ${currentBody === font.name ? 'selected' : ''}`}
                    onClick={() => handleFontChange('body', font.name)}
                  >
                    <span
                      className="font-option-preview"
                      style={{ fontFamily: `'${font.name}', sans-serif` }}
                    >
                      Body text
                    </span>
                    <span className="font-option-name">{font.name}</span>
                    <span className="font-option-category">{font.category}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="type-scale">
        <h4>Type Scale (Auto-generiert)</h4>
        <div className="type-scale-list">
          {typographyScale.map(level => (
            <div key={level.name} className="type-scale-item">
              <span className="scale-name">{level.name}</span>
              <span
                className="scale-preview"
                style={{
                  fontFamily: level.size >= 24 ? fonts.heading : fonts.body,
                  fontSize: Math.min(level.size, 32),
                  fontWeight: level.size >= 24 ? 700 : 400,
                  lineHeight: level.lineHeight
                }}
              >
                {level.use}
              </span>
              <span className="scale-size">{level.size}px</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
