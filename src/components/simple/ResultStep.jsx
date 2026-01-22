import React, { useRef } from 'react';
import { previewComponents } from '../previews/index.jsx';
import { exportAsset } from '../../lib/exporters/index.js';

/**
 * ResultStep - Shows generated content preview with export options
 */
export default function ResultStep({
  brand,
  assetType,
  generatedContent,
  onNewAsset,
  onStartOver,
  setError
}) {
  const previewRef = useRef(null);

  const PreviewComponent = previewComponents[assetType];

  // Content for preview component
  const previewContent = generatedContent?.parsed || {
    fields: {
      headline: { value: 'Generierter Content' },
      body: { value: generatedContent?.raw || '' }
    }
  };

  const handleExport = async (format) => {
    try {
      await exportAsset(brand, previewContent, format, {
        previewRef: previewRef.current
      });
    } catch (err) {
      console.error('Export failed:', err);
      setError(err.message || 'Export fehlgeschlagen');
    }
  };

  const handleCopyText = () => {
    const text = generatedContent?.raw || '';
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast here
    }).catch(err => {
      setError('Kopieren fehlgeschlagen');
    });
  };

  const assetNames = {
    website: 'Website',
    flyer: 'Flyer',
    social: 'Social Media Posts',
    email: 'E-Mail',
    presentation: 'Präsentation',
    businesscard: 'Visitenkarte'
  };

  return (
    <div className="result-step">
      <div className="result-header">
        <h2>{assetNames[assetType] || 'Content'} generiert!</h2>
        <p className="result-subtitle">
          Preview und Export deines generierten Contents
        </p>
      </div>

      <div className="result-content">
        {/* Preview Area */}
        <div className="result-preview-area" ref={previewRef}>
          <div className="preview-wrapper">
            {PreviewComponent ? (
              <PreviewComponent brand={brand} content={previewContent} />
            ) : (
              <div className="text-preview">
                <pre>{generatedContent?.raw}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="result-actions">
          <div className="export-actions">
            <h4>Exportieren</h4>
            <div className="export-buttons">
              <button
                className="btn-export"
                onClick={() => handleExport('pdf')}
                title="Als PDF exportieren"
              >
                <span className="export-icon">PDF</span>
                <span>PDF</span>
              </button>
              <button
                className="btn-export"
                onClick={() => handleExport('png')}
                title="Als Bild exportieren"
              >
                <span className="export-icon">PNG</span>
                <span>PNG</span>
              </button>
              {assetType === 'website' && (
                <button
                  className="btn-export"
                  onClick={() => handleExport('html')}
                  title="Als HTML exportieren"
                >
                  <span className="export-icon">HTML</span>
                  <span>HTML</span>
                </button>
              )}
              <button
                className="btn-export"
                onClick={handleCopyText}
                title="Text kopieren"
              >
                <span className="export-icon">TXT</span>
                <span>Kopieren</span>
              </button>
            </div>
          </div>

          <div className="navigation-actions">
            <button className="btn-secondary" onClick={onNewAsset}>
              Anderes Asset erstellen
            </button>
            <button className="btn-secondary" onClick={onStartOver}>
              Neues Brand hochladen
            </button>
          </div>
        </div>

        {/* Raw Text Toggle */}
        <details className="raw-text-section">
          <summary>Generierter Text anzeigen</summary>
          <div className="raw-text-content">
            <pre>{generatedContent?.raw}</pre>
          </div>
        </details>
      </div>
    </div>
  );
}
