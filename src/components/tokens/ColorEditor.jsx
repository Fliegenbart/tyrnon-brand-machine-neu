import React, { useState } from 'react';

// Generate tints and shades
function generateColorScale(hex) {
  const rgb = hexToRgb(hex);
  const scale = {};

  // Generate 50-900 scale
  for (let i = 50; i <= 900; i += i < 100 ? 50 : 100) {
    const factor = i / 500;
    if (i < 500) {
      // Lighter (tints)
      const tint = rgb.map(c => Math.round(c + (255 - c) * (1 - factor)));
      scale[i] = rgbToHex(tint);
    } else if (i > 500) {
      // Darker (shades)
      const shade = rgb.map(c => Math.round(c * (1 - (factor - 1) * 0.5)));
      scale[i] = rgbToHex(shade);
    } else {
      scale[i] = hex;
    }
  }

  return scale;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

function rgbToHex(rgb) {
  return '#' + rgb.map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('');
}

function hexToCmyk(hex) {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgb.map(c => c / 255);
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  const c = Math.round((1 - r - k) / (1 - k) * 100);
  const m = Math.round((1 - g - k) / (1 - k) * 100);
  const y = Math.round((1 - b - k) / (1 - k) * 100);
  return { c, m, y, k: Math.round(k * 100) };
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hexToRgb(hex1));
  const lum2 = getLuminance(hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return ((brightest + 0.05) / (darkest + 0.05)).toFixed(2);
}

function getLuminance(rgb) {
  const [r, g, b] = rgb.map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const colorKeys = [
  { key: 'primary', label: 'Primary', description: 'Hauptfarbe der Marke' },
  { key: 'secondary', label: 'Secondary', description: 'Sekundäre Akzentfarbe' },
  { key: 'accent', label: 'Accent', description: 'Hervorhebungen, CTAs' },
  { key: 'background', label: 'Background', description: 'Hintergrundfarbe' },
  { key: 'text', label: 'Text', description: 'Haupttextfarbe' },
];

export default function ColorEditor({ colors, onChange }) {
  const [expandedColor, setExpandedColor] = useState('primary');

  const handleColorChange = (key, value) => {
    onChange({ ...colors, [key]: value });
  };

  const primaryScale = generateColorScale(colors.primary);
  const textContrast = getContrastRatio(colors.text, colors.background);
  const primaryContrast = getContrastRatio(colors.primary, colors.background);

  return (
    <div className="color-editor">
      <h3>Farbpalette</h3>
      <p className="editor-description">
        Definiere deine Brand-Farben. Tints und Shades werden automatisch generiert.
      </p>

      <div className="color-list">
        {colorKeys.map(({ key, label, description }) => (
          <div
            key={key}
            className={`color-item ${expandedColor === key ? 'expanded' : ''}`}
          >
            <div
              className="color-item-header"
              onClick={() => setExpandedColor(expandedColor === key ? null : key)}
            >
              <div className="color-item-preview">
                <span
                  className="color-swatch-large"
                  style={{ backgroundColor: colors[key] }}
                />
                <div className="color-item-info">
                  <span className="color-label">{label}</span>
                  <span className="color-value">{colors[key]}</span>
                </div>
              </div>
              <span className="expand-icon">{expandedColor === key ? '−' : '+'}</span>
            </div>

            {expandedColor === key && (
              <div className="color-item-expanded">
                <p className="color-description">{description}</p>

                <div className="color-input-group">
                  <label>HEX</label>
                  <div className="color-input-row">
                    <input
                      type="color"
                      value={colors[key]}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                    />
                    <input
                      type="text"
                      value={colors[key]}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>

                <div className="color-meta">
                  <div className="color-meta-item">
                    <span className="meta-label">RGB</span>
                    <span className="meta-value">{hexToRgb(colors[key]).join(', ')}</span>
                  </div>
                  <div className="color-meta-item">
                    <span className="meta-label">CMYK</span>
                    <span className="meta-value">
                      {Object.values(hexToCmyk(colors[key])).join(', ')}
                    </span>
                  </div>
                </div>

                {key === 'primary' && (
                  <div className="color-scale">
                    <h4>Auto-generierte Skala</h4>
                    <div className="scale-swatches">
                      {Object.entries(primaryScale).map(([weight, color]) => (
                        <div key={weight} className="scale-swatch">
                          <span
                            className="scale-color"
                            style={{ backgroundColor: color }}
                          />
                          <span className="scale-weight">{weight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="contrast-checker">
        <h4>Kontrast-Check (WCAG)</h4>
        <div className="contrast-items">
          <div className={`contrast-item ${parseFloat(textContrast) >= 4.5 ? 'pass' : 'fail'}`}>
            <span className="contrast-label">Text / Background</span>
            <span className="contrast-ratio">{textContrast}:1</span>
            <span className="contrast-status">
              {parseFloat(textContrast) >= 7 ? 'AAA' : parseFloat(textContrast) >= 4.5 ? 'AA' : 'Fail'}
            </span>
          </div>
          <div className={`contrast-item ${parseFloat(primaryContrast) >= 3 ? 'pass' : 'fail'}`}>
            <span className="contrast-label">Primary / Background</span>
            <span className="contrast-ratio">{primaryContrast}:1</span>
            <span className="contrast-status">
              {parseFloat(primaryContrast) >= 4.5 ? 'AA' : parseFloat(primaryContrast) >= 3 ? 'AA Large' : 'Fail'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
