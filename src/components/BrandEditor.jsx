import React, { useState } from 'react';

export default function BrandEditor({ brand, onUpdate }) {
  const [openSection, setOpenSection] = useState(null);

  const updateColors = (colorKey, value) => {
    onUpdate({ ...brand, colors: { ...brand.colors, [colorKey]: value } });
  };

  const updateFonts = (fontKey, value) => {
    onUpdate({ ...brand, fonts: { ...brand.fonts, [fontKey]: value } });
  };

  const updateVoice = (voiceKey, value) => {
    onUpdate({ ...brand, voice: { ...brand.voice, [voiceKey]: value } });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => onUpdate({ ...brand, logo: ev.target.result });
      reader.readAsDataURL(file);
    }
  };

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const sections = [
    { id: 'colors', label: 'Farben', icon: '◐' },
    { id: 'typography', label: 'Typografie', icon: 'Aa' },
    { id: 'voice', label: 'Stimme', icon: '◎' },
    { id: 'logo', label: 'Logo', icon: '◇' },
  ];

  return (
    <div className="brand-editor-compact">
      <div className="editor-sections">
        {sections.map(section => (
          <div key={section.id} className={`editor-dropdown ${openSection === section.id ? 'open' : ''}`}>
            <button
              className="dropdown-trigger"
              onClick={() => toggleSection(section.id)}
            >
              <span className="dropdown-icon">{section.icon}</span>
              <span className="dropdown-label">{section.label}</span>
              <span className="dropdown-arrow">{openSection === section.id ? '−' : '+'}</span>
            </button>

            {openSection === section.id && (
              <div className="dropdown-content">
                {section.id === 'colors' && (
                  <div className="color-grid-compact">
                    {[
                      { key: 'primary', label: 'Primär' },
                      { key: 'secondary', label: 'Sekundär' },
                      { key: 'accent', label: 'Akzent' },
                      { key: 'background', label: 'Hintergrund' },
                      { key: 'text', label: 'Text' }
                    ].map(color => (
                      <div key={color.key} className="color-item">
                        <input
                          type="color"
                          value={brand.colors[color.key]}
                          onChange={(e) => updateColors(color.key, e.target.value)}
                        />
                        <div className="color-info">
                          <span className="color-label">{color.label}</span>
                          <input
                            type="text"
                            value={brand.colors[color.key]}
                            onChange={(e) => updateColors(color.key, e.target.value)}
                            className="color-hex"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {section.id === 'typography' && (
                  <div className="typography-settings">
                    <div className="font-setting">
                      <label>Überschriften</label>
                      <select
                        value={brand.fonts.heading}
                        onChange={(e) => updateFonts('heading', e.target.value)}
                      >
                        <option value="'Playfair Display', serif">Playfair Display</option>
                        <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                        <option value="'Bebas Neue', sans-serif">Bebas Neue</option>
                        <option value="'DM Sans', sans-serif">DM Sans</option>
                        <option value="'IBM Plex Sans', sans-serif">IBM Plex Sans</option>
                      </select>
                      <p className="font-preview" style={{ fontFamily: brand.fonts.heading }}>
                        Das ist ein Beispiel
                      </p>
                    </div>
                    <div className="font-setting">
                      <label>Fließtext</label>
                      <select
                        value={brand.fonts.body}
                        onChange={(e) => updateFonts('body', e.target.value)}
                      >
                        <option value="'Inter', sans-serif">Inter</option>
                        <option value="'Source Sans 3', sans-serif">Source Sans</option>
                        <option value="'Lora', serif">Lora</option>
                        <option value="'Work Sans', sans-serif">Work Sans</option>
                        <option value="'IBM Plex Serif', serif">IBM Plex Serif</option>
                      </select>
                      <p className="font-preview body" style={{ fontFamily: brand.fonts.body }}>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      </p>
                    </div>
                  </div>
                )}

                {section.id === 'voice' && (
                  <div className="voice-settings">
                    <div className="voice-row">
                      <div className="voice-field">
                        <label>Tonalität</label>
                        <select
                          value={brand.voice.tone}
                          onChange={(e) => updateVoice('tone', e.target.value)}
                        >
                          <option value="professional">Professionell</option>
                          <option value="friendly">Freundlich</option>
                          <option value="innovative">Innovativ</option>
                          <option value="premium">Premium</option>
                          <option value="playful">Spielerisch</option>
                          <option value="trustworthy">Vertrauenswürdig</option>
                        </select>
                      </div>
                      <div className="voice-field">
                        <label>Ansprache</label>
                        <select
                          value={brand.voice.formality}
                          onChange={(e) => updateVoice('formality', e.target.value)}
                        >
                          <option value="du">Du</option>
                          <option value="sie">Sie</option>
                          <option value="wir">Wir</option>
                        </select>
                      </div>
                    </div>
                    <div className="voice-field">
                      <label>Tagline / Claim</label>
                      <input
                        type="text"
                        value={brand.voice.tagline || ''}
                        onChange={(e) => updateVoice('tagline', e.target.value)}
                        placeholder="Die Kernbotschaft der Marke"
                      />
                    </div>
                    <div className="voice-field">
                      <label>Do's — bevorzugte Wörter</label>
                      <textarea
                        value={brand.voice.dos || ''}
                        onChange={(e) => updateVoice('dos', e.target.value)}
                        placeholder="innovativ, nachhaltig, zukunftsorientiert"
                        rows={2}
                      />
                    </div>
                    <div className="voice-field">
                      <label>Don'ts — vermeiden</label>
                      <textarea
                        value={brand.voice.donts || ''}
                        onChange={(e) => updateVoice('donts', e.target.value)}
                        placeholder="billig, irgendwie, vielleicht"
                        rows={2}
                      />
                    </div>
                  </div>
                )}

                {section.id === 'logo' && (
                  <div className="logo-settings">
                    <div
                      className="logo-upload-zone"
                      style={{ borderColor: brand.colors.primary + '40' }}
                    >
                      {brand.logo ? (
                        <div className="logo-preview-container">
                          <img src={brand.logo} alt="Logo" />
                          <button
                            className="logo-remove"
                            onClick={() => onUpdate({ ...brand, logo: null })}
                          >
                            Entfernen
                          </button>
                        </div>
                      ) : (
                        <div className="logo-upload-prompt">
                          <span className="upload-icon">↑</span>
                          <span>Logo hochladen</span>
                          <span className="upload-hint">PNG, SVG empfohlen</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="logo-file-input"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
