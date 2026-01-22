import React, { useState } from 'react';
import { exportAsset, exportFormats } from '../lib/exporters/index.js';

export default function ExportPanel({ brand, content }) {
  const [exporting, setExporting] = useState(null);

  const handleExport = async (format) => {
    setExporting(format);
    try {
      await exportAsset(brand, content, format);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export fehlgeschlagen: ' + err.message);
    }
    setExporting(null);
  };

  const groupedFormats = exportFormats.reduce((acc, format) => {
    if (!acc[format.category]) acc[format.category] = [];
    acc[format.category].push(format);
    return acc;
  }, {});

  const categoryNames = {
    tokens: 'Design Tokens',
    documents: 'Dokumente',
    web: 'Web / E-Mail',
    all: 'Komplett'
  };

  return (
    <div className="export-panel">
      <h3>Exportieren</h3>

      {Object.entries(groupedFormats).map(([category, formats]) => (
        <div key={category} className="export-category">
          <h4>{categoryNames[category]}</h4>
          <div className="export-grid">
            {formats.map(format => (
              <button
                key={format.id}
                className="export-button"
                onClick={() => handleExport(format.id)}
                disabled={exporting === format.id}
              >
                <span className="export-icon">{format.icon}</span>
                <span className="export-name">{format.name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
