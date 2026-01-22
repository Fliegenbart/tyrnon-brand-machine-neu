import React, { useState, useCallback } from 'react';
import { parsePptx } from '../lib/pptxParser.js';

export default function BrandImport({ onImport, onClose }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedBrand, setExtractedBrand] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pptx', 'ppt'].includes(ext)) {
      setError('Bitte eine PowerPoint-Datei (.pptx) hochladen');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const brand = await parsePptx(file);
      setExtractedBrand(brand);
    } catch (err) {
      console.error('Parse error:', err);
      setError('Fehler beim Parsen der Datei. Ist es eine gultige PPTX?');
    }

    setIsProcessing(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e) => {
    const file = e.target.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleConfirm = () => {
    if (extractedBrand) {
      const newBrand = {
        ...extractedBrand,
        id: Date.now().toString()
      };
      onImport(newBrand);
    }
  };

  return (
    <div className="brand-import-overlay" onClick={onClose}>
      <div className="brand-import-modal" onClick={e => e.stopPropagation()}>
        <div className="import-header">
          <h2>Brand aus PowerPoint importieren</h2>
          <button className="btn-close" onClick={onClose}>x</button>
        </div>

        {!extractedBrand ? (
          <>
            <div
              className={`import-dropzone ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                accept=".pptx,.ppt"
                onChange={handleFileInput}
                disabled={isProcessing}
              />

              {isProcessing ? (
                <div className="processing-state">
                  <div className="spinner"></div>
                  <p>Extrahiere Brand-Elemente...</p>
                </div>
              ) : (
                <div className="dropzone-content">
                  <div className="dropzone-icon">
                    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M24 32V16M24 16L18 22M24 16L30 22" />
                      <path d="M8 32V36C8 38.2 9.8 40 12 40H36C38.2 40 40 38.2 40 36V32" />
                    </svg>
                  </div>
                  <p className="dropzone-title">PowerPoint hier ablegen</p>
                  <p className="dropzone-hint">oder klicken zum Auswahlen</p>
                  <span className="dropzone-formats">.pptx</span>
                </div>
              )}
            </div>

            {error && <p className="import-error">{error}</p>}

            <div className="import-info">
              <h4>Was wird extrahiert?</h4>
              <ul>
                <li>Farben aus Theme & Slides</li>
                <li>Schriftarten</li>
                <li>Logos & Bilder</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="import-preview">
            <h3>Extrahierte Brand-Elemente</h3>

            <div className="preview-section">
              <label>Name</label>
              <input
                type="text"
                value={extractedBrand.name}
                onChange={(e) => setExtractedBrand({ ...extractedBrand, name: e.target.value })}
              />
            </div>

            <div className="preview-section">
              <label>Farben ({extractedBrand.extractedAssets?.allColors?.length || 0} gefunden)</label>
              <div className="color-swatches">
                {extractedBrand.extractedAssets?.allColors?.slice(0, 12).map((color, i) => (
                  <div
                    key={i}
                    className={`color-swatch-large ${
                      color === extractedBrand.colors.primary ? 'selected primary' :
                      color === extractedBrand.colors.accent ? 'selected accent' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                    onClick={() => {
                      // Click to set as primary
                      setExtractedBrand({
                        ...extractedBrand,
                        colors: { ...extractedBrand.colors, primary: color }
                      });
                    }}
                  />
                ))}
              </div>
              <small>Klicke auf eine Farbe um sie als Primarfarbe zu setzen</small>
            </div>

            <div className="preview-section">
              <label>Ausgewahlte Farben</label>
              <div className="selected-colors">
                <div className="selected-color">
                  <span className="color-dot" style={{ backgroundColor: extractedBrand.colors.primary }}></span>
                  <span>Primar: {extractedBrand.colors.primary}</span>
                </div>
                <div className="selected-color">
                  <span className="color-dot" style={{ backgroundColor: extractedBrand.colors.secondary }}></span>
                  <span>Sekundar: {extractedBrand.colors.secondary}</span>
                </div>
                <div className="selected-color">
                  <span className="color-dot" style={{ backgroundColor: extractedBrand.colors.accent }}></span>
                  <span>Akzent: {extractedBrand.colors.accent}</span>
                </div>
              </div>
            </div>

            {extractedBrand.extractedAssets?.allFonts?.length > 0 && (
              <div className="preview-section">
                <label>Schriftarten</label>
                <div className="font-list">
                  {extractedBrand.extractedAssets.allFonts.slice(0, 5).map((font, i) => (
                    <span key={i} className="font-tag">{font}</span>
                  ))}
                </div>
              </div>
            )}

            {extractedBrand.extractedAssets?.allImages?.length > 0 && (
              <div className="preview-section">
                <label>Bilder ({extractedBrand.extractedAssets.allImages.length} gefunden)</label>
                <div className="image-grid-preview">
                  {extractedBrand.extractedAssets.allImages.slice(0, 6).map((img, i) => (
                    <div
                      key={i}
                      className={`image-thumb ${extractedBrand.logo === img.data ? 'selected-logo' : ''}`}
                      onClick={() => setExtractedBrand({ ...extractedBrand, logo: img.data })}
                    >
                      <img src={img.data} alt={img.name} />
                      {img.isLogo && <span className="logo-badge">Logo?</span>}
                    </div>
                  ))}
                </div>
                <small>Klicke auf ein Bild um es als Logo zu setzen</small>
              </div>
            )}

            {extractedBrand.logo && (
              <div className="preview-section">
                <label>Ausgewahltes Logo</label>
                <div className="logo-preview-large">
                  <img src={extractedBrand.logo} alt="Logo" />
                </div>
              </div>
            )}

            <div className="import-actions">
              <button className="btn-secondary" onClick={() => setExtractedBrand(null)}>
                Zuruck
              </button>
              <button className="btn-primary" onClick={handleConfirm}>
                Brand importieren
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
