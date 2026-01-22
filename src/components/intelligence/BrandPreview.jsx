import React, { useState } from 'react';

export default function BrandPreview({ extractedData, existingBrand, onApply, onCancel }) {
  const { colors = [], fonts = [], logos = [], toneOfVoice, additionalNotes } = extractedData || {};

  // Import mode: 'replace' overwrites, 'add' merges with existing
  const [importMode, setImportMode] = useState('add');

  // State für Farbzuweisung
  const [selectedColors, setSelectedColors] = useState({
    primary: colors[0]?.hex || null,
    secondary: colors[1]?.hex || null,
    accent: colors[2]?.hex || null,
    background: '#ffffff',
    text: '#1d1d1f'
  });

  // Additional colors to add to palette
  const [selectedPaletteColors, setSelectedPaletteColors] = useState(
    colors.slice(3).map(c => ({ ...c, selected: true }))
  );

  const [selectedFonts, setSelectedFonts] = useState({
    heading: fonts[0]?.name || null,
    body: fonts[1]?.name || fonts[0]?.name || null
  });

  // Additional fonts
  const [selectedAdditionalFonts, setSelectedAdditionalFonts] = useState(
    fonts.slice(2).map(f => ({ ...f, selected: true }))
  );

  const [selectedLogo, setSelectedLogo] = useState(logos[0]?.dataUrl || null);

  // Additional logos to add
  const [selectedAdditionalLogos, setSelectedAdditionalLogos] = useState(
    logos.slice(1).map(l => ({ ...l, selected: true }))
  );

  const handleColorSelect = (role, hex) => {
    setSelectedColors(prev => ({ ...prev, [role]: hex }));
  };

  const togglePaletteColor = (index) => {
    setSelectedPaletteColors(prev =>
      prev.map((c, i) => i === index ? { ...c, selected: !c.selected } : c)
    );
  };

  const toggleAdditionalFont = (index) => {
    setSelectedAdditionalFonts(prev =>
      prev.map((f, i) => i === index ? { ...f, selected: !f.selected } : f)
    );
  };

  const toggleAdditionalLogo = (index) => {
    setSelectedAdditionalLogos(prev =>
      prev.map((l, i) => i === index ? { ...l, selected: !l.selected } : l)
    );
  };

  const handleApply = () => {
    const newPaletteColors = selectedPaletteColors
      .filter(c => c.selected)
      .map(c => ({ hex: c.hex, name: c.name, source: c.source }));

    const newAdditionalFonts = selectedAdditionalFonts
      .filter(f => f.selected)
      .map(f => ({ name: f.name, usage: f.usage, description: f.description }));

    const newAdditionalLogos = selectedAdditionalLogos
      .filter(l => l.selected)
      .map(l => ({ dataUrl: l.dataUrl, name: l.name, description: l.description }));

    onApply({
      colors: selectedColors,
      paletteColors: newPaletteColors,
      fonts: selectedFonts,
      additionalFonts: newAdditionalFonts,
      logo: selectedLogo,
      additionalLogos: newAdditionalLogos,
      toneOfVoice,
      importMode
    });
  };

  const colorRoles = [
    { key: 'primary', label: 'Primär' },
    { key: 'secondary', label: 'Sekundär' },
    { key: 'accent', label: 'Akzent' }
  ];

  // Get existing brand assets for display
  const existingPalette = existingBrand?.colors?.palette || [];
  const existingLogos = existingBrand?.logos || [];
  const existingAdditionalFonts = existingBrand?.fonts?.additional || [];

  return (
    <div className="brand-preview">
      <div className="preview-header">
        <h2>Gefundene Brand-Elemente</h2>
        <p>Wähle aus, welche Elemente du übernehmen möchtest</p>

        {/* Import Mode Toggle */}
        <div className="import-mode-toggle">
          <button
            className={`mode-btn ${importMode === 'add' ? 'active' : ''}`}
            onClick={() => setImportMode('add')}
          >
            Zu bestehenden hinzufügen
          </button>
          <button
            className={`mode-btn ${importMode === 'replace' ? 'active' : ''}`}
            onClick={() => setImportMode('replace')}
          >
            Ersetzen
          </button>
        </div>
      </div>

      {/* Existing Brand Assets (if in add mode) */}
      {importMode === 'add' && (existingPalette.length > 0 || existingLogos.length > 0) && (
        <section className="preview-section existing-assets">
          <h3>Vorhandene Assets</h3>
          {existingPalette.length > 0 && (
            <div className="existing-colors">
              <span className="existing-label">Farbpalette:</span>
              {existingPalette.map((c, i) => (
                <div
                  key={i}
                  className="color-swatch-small"
                  style={{ backgroundColor: c.hex }}
                  title={c.hex}
                />
              ))}
            </div>
          )}
          {existingLogos.length > 0 && (
            <div className="existing-logos">
              <span className="existing-label">Logos:</span>
              {existingLogos.map((l, i) => (
                <img key={i} src={l.dataUrl} alt={l.name} className="existing-logo-thumb" />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Farben */}
      <section className="preview-section">
        <h3>Farben ({colors.length} gefunden)</h3>

        {colors.length > 0 ? (
          <>
            <div className="color-palette">
              {colors.map((color, i) => (
                <div
                  key={i}
                  className="color-swatch-large"
                  style={{ backgroundColor: color.hex }}
                  title={`${color.hex}${color.name ? ` - ${color.name}` : ''}`}
                >
                  <span className="color-hex">{color.hex}</span>
                  {color.name && <span className="color-name">{color.name}</span>}
                </div>
              ))}
            </div>

            <div className="color-assignment">
              <h4>Hauptfarben zuweisen:</h4>
              {colorRoles.map(({ key, label }) => (
                <div key={key} className="color-role">
                  <label>{label}:</label>
                  <div className="color-options">
                    {colors.slice(0, 8).map((color, i) => (
                      <button
                        key={i}
                        className={`color-option ${selectedColors[key] === color.hex ? 'selected' : ''}`}
                        style={{ backgroundColor: color.hex }}
                        onClick={() => handleColorSelect(key, color.hex)}
                        title={color.hex}
                      />
                    ))}
                  </div>
                  {selectedColors[key] && (
                    <span className="selected-color">{selectedColors[key]}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Additional colors for palette */}
            {selectedPaletteColors.length > 0 && (
              <div className="additional-colors">
                <h4>Weitere Farben zur Palette hinzufügen:</h4>
                <div className="color-checkboxes">
                  {selectedPaletteColors.map((color, i) => (
                    <label key={i} className={`color-checkbox ${color.selected ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={color.selected}
                        onChange={() => togglePaletteColor(i)}
                      />
                      <span
                        className="color-swatch-check"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="color-hex-small">{color.hex}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="no-results">Keine Farben gefunden</p>
        )}
      </section>

      {/* Logos */}
      <section className="preview-section">
        <h3>Logo ({logos.length} gefunden)</h3>

        {logos.length > 0 ? (
          <>
            <div className="logo-grid">
              {logos.map((logo, i) => (
                <div
                  key={i}
                  className={`logo-option ${selectedLogo === logo.dataUrl ? 'selected' : ''}`}
                  onClick={() => setSelectedLogo(logo.dataUrl)}
                >
                  {logo.dataUrl ? (
                    <img src={logo.dataUrl} alt={logo.name || `Logo ${i + 1}`} />
                  ) : (
                    <div className="logo-placeholder">
                      <span>{logo.description || 'Logo'}</span>
                    </div>
                  )}
                  {logo.name && <span className="logo-name">{logo.name}</span>}
                </div>
              ))}
            </div>

            {/* Additional logos */}
            {selectedAdditionalLogos.length > 0 && (
              <div className="additional-logos">
                <h4>Weitere Logos hinzufügen:</h4>
                <div className="logo-checkboxes">
                  {selectedAdditionalLogos.map((logo, i) => (
                    <label key={i} className={`logo-checkbox ${logo.selected ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={logo.selected}
                        onChange={() => toggleAdditionalLogo(i)}
                      />
                      {logo.dataUrl ? (
                        <img src={logo.dataUrl} alt={logo.name} className="logo-thumb" />
                      ) : (
                        <span className="logo-desc">{logo.description}</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="no-results">Keine Logos gefunden - du kannst später ein Logo in den Brand-Einstellungen hinzufügen</p>
        )}
      </section>

      {/* Schriften */}
      <section className="preview-section">
        <h3>Schriften ({fonts.length} gefunden)</h3>

        {fonts.length > 0 ? (
          <>
            <div className="font-list">
              {fonts.map((font, i) => (
                <div key={i} className="font-item">
                  <span
                    className="font-sample"
                    style={{ fontFamily: font.name }}
                  >
                    {font.name}
                  </span>
                  <span className="font-usage">
                    {font.usage === 'heading' ? 'Headlines' : font.usage === 'body' ? 'Fließtext' : font.usage}
                  </span>
                  <div className="font-actions">
                    <button
                      className={selectedFonts.heading === font.name ? 'active' : ''}
                      onClick={() => setSelectedFonts(prev => ({ ...prev, heading: font.name }))}
                    >
                      Headline
                    </button>
                    <button
                      className={selectedFonts.body === font.name ? 'active' : ''}
                      onClick={() => setSelectedFonts(prev => ({ ...prev, body: font.name }))}
                    >
                      Body
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="no-results">Keine Schriften gefunden - Standard-Schriften werden verwendet</p>
        )}
      </section>

      {/* Tone of Voice */}
      {toneOfVoice && (
        <section className="preview-section">
          <h3>Tone of Voice</h3>
          <div className="tone-of-voice">
            {toneOfVoice.keywords?.length > 0 && (
              <div className="tov-keywords">
                {toneOfVoice.keywords.map((kw, i) => (
                  <span key={i} className="tov-keyword">{kw}</span>
                ))}
              </div>
            )}
            {toneOfVoice.description && (
              <p className="tov-description">{toneOfVoice.description}</p>
            )}
          </div>
        </section>
      )}

      {/* Additional Notes */}
      {additionalNotes && (
        <section className="preview-section">
          <h3>Weitere Hinweise</h3>
          <p className="additional-notes">{additionalNotes}</p>
        </section>
      )}

      {/* Preview */}
      <section className="preview-section">
        <h3>Vorschau</h3>
        <div
          className="brand-mini-preview"
          style={{
            backgroundColor: selectedColors.background,
            color: selectedColors.text
          }}
        >
          {selectedLogo && (
            <img src={selectedLogo} alt="Logo" className="mini-preview-logo" />
          )}
          <h4 style={{
            color: selectedColors.primary,
            fontFamily: selectedFonts.heading || 'inherit'
          }}>
            Headline Text
          </h4>
          <p style={{ fontFamily: selectedFonts.body || 'inherit' }}>
            Body text beispiel mit der gewählten Schriftart.
          </p>
          <button style={{ backgroundColor: selectedColors.accent, color: '#fff' }}>
            Button
          </button>
        </div>
      </section>

      {/* Actions */}
      <div className="preview-actions">
        <button className="btn-secondary" onClick={onCancel}>
          Zurück
        </button>
        <button className="btn-primary btn-large" onClick={handleApply}>
          {importMode === 'add' ? 'Zu Brand hinzufügen' : 'In Brand übernehmen'}
        </button>
      </div>
    </div>
  );
}
