import React, { useState, useCallback, useEffect } from 'react';
import { getFigmaToken, setFigmaToken, analyzeFigmaFile, extractFileKey } from '../../lib/figma-api.js';

const acceptedTypes = {
  'templates': { icon: 'T', label: 'Templates', accept: '.pptx,.ppt,.potx,.pdf' },
  'images': { icon: 'I', label: 'Bilder & Logos', accept: '.png,.jpg,.jpeg,.svg,.webp,.gif,.ico' },
  'fonts': { icon: 'F', label: 'Schriften', accept: '.ttf,.otf,.woff,.woff2' },
  'tokens': { icon: '{', label: 'Design Tokens', accept: '.json' }
};

const allAcceptedExtensions = [
  'pptx', 'ppt', 'potx', 'pdf',
  'png', 'jpg', 'jpeg', 'svg', 'webp', 'gif', 'ico',
  'ttf', 'otf', 'woff', 'woff2',
  'json'
];

export default function AnalyzerUpload({ onStartAnalysis, onFigmaAnalysis }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Figma state
  const [figmaToken, setFigmaTokenState] = useState('');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [figmaLoading, setFigmaLoading] = useState(false);
  const [figmaProgress, setFigmaProgress] = useState({ percent: 0, message: '' });
  const [figmaError, setFigmaError] = useState(null);
  const [showFigmaToken, setShowFigmaToken] = useState(false);

  // Load saved token on mount
  useEffect(() => {
    const saved = getFigmaToken();
    if (saved) {
      setFigmaTokenState(saved);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
    e.target.value = '';
  }, []);

  const addFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return allAcceptedExtensions.includes(ext);
    });

    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const unique = validFiles.filter(f => !existingNames.has(f.name));
      return [...prev, ...unique];
    });
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['pptx', 'ppt', 'potx'].includes(ext)) return 'P';
    if (ext === 'pdf') return 'D';
    if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) return 'F';
    if (['svg'].includes(ext)) return 'S';
    if (ext === 'json') return '{';
    return 'I';
  };

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['pptx', 'ppt'].includes(ext)) return 'PowerPoint';
    if (ext === 'potx') return 'PowerPoint Template';
    if (ext === 'pdf') return 'PDF';
    if (['ttf', 'otf'].includes(ext)) return 'Schriftart';
    if (['woff', 'woff2'].includes(ext)) return 'Web-Schrift';
    if (ext === 'svg') return 'SVG Vektor';
    if (ext === 'ico') return 'Favicon';
    if (ext === 'json') return 'Design Tokens';
    return 'Bild';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleStart = () => {
    if (files.length > 0) {
      onStartAnalysis(files);
    }
  };

  // Figma handlers
  const handleSaveFigmaToken = () => {
    setFigmaToken(figmaToken);
    setShowFigmaToken(false);
  };

  const handleFigmaImport = async () => {
    if (!figmaUrl.trim()) {
      setFigmaError('Bitte eine Figma-URL eingeben');
      return;
    }

    if (!figmaToken) {
      setFigmaError('Bitte zuerst einen Figma API Token eingeben');
      setShowFigmaToken(true);
      return;
    }

    const fileKey = extractFileKey(figmaUrl);
    if (!fileKey) {
      setFigmaError('Ungültige Figma-URL. Beispiel: https://www.figma.com/design/ABC123/...');
      return;
    }

    setFigmaLoading(true);
    setFigmaError(null);
    setFigmaProgress({ percent: 0, message: 'Starte...' });

    try {
      const analysis = await analyzeFigmaFile(figmaUrl, (percent, message) => {
        setFigmaProgress({ percent, message });
      });

      // Pass analysis to parent
      if (onFigmaAnalysis) {
        onFigmaAnalysis(analysis);
      }

      setFigmaUrl('');
      setFigmaProgress({ percent: 100, message: 'Fertig!' });
    } catch (err) {
      setFigmaError(err.message);
    } finally {
      setFigmaLoading(false);
    }
  };

  // Count files by type
  const fileCounts = {
    templates: files.filter(f => ['pptx', 'ppt', 'potx', 'pdf'].includes(f.name.split('.').pop().toLowerCase())).length,
    images: files.filter(f => ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif', 'ico'].includes(f.name.split('.').pop().toLowerCase())).length,
    fonts: files.filter(f => ['ttf', 'otf', 'woff', 'woff2'].includes(f.name.split('.').pop().toLowerCase())).length,
    tokens: files.filter(f => f.name.split('.').pop().toLowerCase() === 'json').length
  };

  const hasFigmaToken = !!figmaToken;

  return (
    <div className="analyzer-upload">
      <div className="upload-intro">
        <div className="upload-icon-large">
          <span>+</span>
        </div>
        <h2>Brand-Assets hochladen</h2>
        <p>
          Lade deine Logos, Bilder, Schriften und Templates hoch.
          Wir extrahieren automatisch Farben, Schriften und Stilregeln.
        </p>
      </div>

      {/* Figma Integration Section */}
      <div className="figma-section">
        <div className="figma-header">
          <div className="figma-logo">
            <svg width="20" height="20" viewBox="0 0 38 57" fill="none">
              <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
              <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
              <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
              <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
              <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
            </svg>
            <span>Figma Import</span>
          </div>
          <button
            className={`btn-figma-token ${hasFigmaToken ? 'has-token' : ''}`}
            onClick={() => setShowFigmaToken(!showFigmaToken)}
          >
            {hasFigmaToken ? 'Token gespeichert' : 'API Token eingeben'}
          </button>
        </div>

        {showFigmaToken && (
          <div className="figma-token-input">
            <input
              type="password"
              value={figmaToken}
              onChange={(e) => setFigmaTokenState(e.target.value)}
              placeholder="Figma Personal Access Token"
            />
            <button className="btn-save-token" onClick={handleSaveFigmaToken}>
              Speichern
            </button>
            <a
              href="https://www.figma.com/developers/api#access-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="token-help-link"
            >
              Token erstellen
            </a>
          </div>
        )}

        <div className="figma-url-input">
          <input
            type="url"
            value={figmaUrl}
            onChange={(e) => setFigmaUrl(e.target.value)}
            placeholder="https://www.figma.com/design/... oder /file/..."
            disabled={figmaLoading}
          />
          <button
            className="btn-figma-import"
            onClick={handleFigmaImport}
            disabled={figmaLoading || !figmaUrl.trim()}
          >
            {figmaLoading ? (
              <>
                <span className="figma-spinner"></span>
                {figmaProgress.percent}%
              </>
            ) : (
              'Importieren'
            )}
          </button>
        </div>

        {figmaLoading && (
          <div className="figma-progress">
            <div className="figma-progress-bar">
              <div
                className="figma-progress-fill"
                style={{ width: `${figmaProgress.percent}%` }}
              />
            </div>
            <span className="figma-progress-text">{figmaProgress.message}</span>
          </div>
        )}

        {figmaError && (
          <div className="figma-error">
            <span>!</span>
            {figmaError}
            <button onClick={() => setFigmaError(null)}>×</button>
          </div>
        )}
      </div>

      <div className="upload-divider">
        <span>oder Dateien hochladen</span>
      </div>

      <div
        className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="dropzone-content">
          <div className="dropzone-icon">+</div>
          <p className="dropzone-text">
            Dateien hierher ziehen oder <label className="dropzone-browse">
              durchsuchen
              <input
                type="file"
                multiple
                accept={allAcceptedExtensions.map(e => '.' + e).join(',')}
                onChange={handleFileSelect}
                hidden
              />
            </label>
          </p>
          <p className="dropzone-hint">
            Bilder, Logos, Schriften, PowerPoint, PDF, JSON
          </p>
        </div>
      </div>

      <div className="upload-types">
        {Object.entries(acceptedTypes).map(([key, { icon, label, accept }]) => (
          <label key={key} className="upload-type-card">
            <input
              type="file"
              multiple
              accept={accept}
              onChange={handleFileSelect}
              hidden
            />
            <span className="type-icon">{icon}</span>
            <span className="type-label">{label}</span>
          </label>
        ))}
      </div>

      {files.length > 0 && (
        <div className="upload-file-list">
          <div className="file-list-header">
            <h3>Ausgewählte Dateien ({files.length})</h3>
            <div className="file-counts">
              {fileCounts.templates > 0 && <span className="file-count-badge">{fileCounts.templates} Templates</span>}
              {fileCounts.images > 0 && <span className="file-count-badge">{fileCounts.images} Bilder</span>}
              {fileCounts.fonts > 0 && <span className="file-count-badge">{fileCounts.fonts} Schriften</span>}
              {fileCounts.tokens > 0 && <span className="file-count-badge">{fileCounts.tokens} Tokens</span>}
            </div>
            <button
              className="btn-text"
              onClick={() => setFiles([])}
            >
              Alle entfernen
            </button>
          </div>

          <div className="file-list">
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <span className="file-icon">{getFileIcon(file.name)}</span>
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-meta">
                    {getFileType(file.name)} • {formatFileSize(file.size)}
                  </span>
                </div>
                <button
                  className="file-remove"
                  onClick={() => removeFile(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            className="btn-primary btn-large"
            onClick={handleStart}
          >
            <span className="btn-icon">*</span>
            {fileCounts.templates > 0 ? 'Analyse starten' : 'Assets hinzufügen'}
          </button>
        </div>
      )}
    </div>
  );
}
