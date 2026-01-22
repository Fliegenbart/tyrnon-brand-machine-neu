import React, { useState, useEffect } from 'react';

export default function Settings() {
  const [openaiKey, setOpenaiKey] = useState('');
  const [unsplashKey, setUnsplashKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setOpenaiKey(localStorage.getItem('openai_api_key') || '');
    setUnsplashKey(localStorage.getItem('unsplash_access_key') || '');
  }, []);

  const handleSave = () => {
    if (openaiKey) {
      localStorage.setItem('openai_api_key', openaiKey);
    } else {
      localStorage.removeItem('openai_api_key');
    }
    if (unsplashKey) {
      localStorage.setItem('unsplash_access_key', unsplashKey);
    } else {
      localStorage.removeItem('unsplash_access_key');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-page">
      <header className="page-header">
        <div className="page-header-content">
          <h1>Einstellungen</h1>
          <p className="page-subtitle">API Keys und Konfiguration</p>
        </div>
      </header>

      <div className="settings-content">
        <section className="settings-section">
          <h2>API Schlüssel</h2>
          <p className="settings-description">
            Verbinde externe Dienste für erweiterte Funktionen
          </p>

          <div className="settings-form">
            <div className="form-group">
              <label htmlFor="openai">OpenAI API Key</label>
              <p className="form-help">Für AI Text- und Bildgenerierung</p>
              <input
                id="openai"
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="unsplash">Unsplash Access Key</label>
              <p className="form-help">Für kostenlose Stock-Bilder</p>
              <input
                id="unsplash"
                type="password"
                value={unsplashKey}
                onChange={(e) => setUnsplashKey(e.target.value)}
                placeholder="Access Key..."
              />
            </div>

            <button className="btn-primary" onClick={handleSave}>
              {saved ? '✓ Gespeichert' : 'Speichern'}
            </button>
          </div>
        </section>

        <section className="settings-section">
          <h2>Über TYRN.ON</h2>
          <p className="settings-description">
            Brand Engine v3.0 - Master Design Token System
          </p>
          <div className="settings-info">
            <p>
              TYRN.ON Brand Engine ist dein zentrales System für Brand Management.
              Definiere deine Marke einmal und exportiere sie in alle Formate:
            </p>
            <ul>
              <li>Figma Variables (W3C Design Tokens)</li>
              <li>PowerPoint Theme (.thmx)</li>
              <li>CSS / Tailwind Config</li>
              <li>Print-ready PDFs mit CMYK</li>
            </ul>
          </div>
        </section>

        <section className="settings-section">
          <h2>Daten</h2>
          <div className="settings-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                const data = {
                  brands: JSON.parse(localStorage.getItem('brand_engine_brands') || '[]'),
                  content: JSON.parse(localStorage.getItem('brand_engine_content') || '{}')
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'tyrnon-backup.json';
                a.click();
              }}
            >
              Daten exportieren
            </button>
            <button
              className="btn-danger"
              onClick={() => {
                if (confirm('Alle lokalen Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
                  localStorage.removeItem('brand_engine_brands');
                  localStorage.removeItem('brand_engine_content');
                  window.location.reload();
                }
              }}
            >
              Lokale Daten löschen
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
