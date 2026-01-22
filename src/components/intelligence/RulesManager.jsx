import React, { useState } from 'react';
import { useRulesStore } from '../../stores/rulesStore';

const categoryLabels = {
  color: { label: 'Farben', icon: 'C' },
  typography: { label: 'Typografie', icon: 'T' },
  spacing: { label: 'Abstände', icon: 'S' },
  component: { label: 'Komponenten', icon: 'K' }
};

export default function RulesManager({ brandId, onReanalyze, extractedAssets }) {
  const {
    getRulesForBrand,
    getRuleSummary,
    deleteRule,
    updateRule,
    clearRules,
    exportRules,
    importRules
  } = useRulesStore();

  const [filter, setFilter] = useState('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');

  const rules = getRulesForBrand(brandId);
  const summary = getRuleSummary(brandId);
  const assets = extractedAssets || { logos: [], images: [] };

  const filteredRules = filter === 'all'
    ? rules
    : rules.filter(r => r.category === filter);

  const handleExport = () => {
    const json = exportRules(brandId);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brand-rules-${brandId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (importRules(brandId, importJson)) {
      setShowImportModal(false);
      setImportJson('');
    } else {
      alert('Ungültiges JSON-Format');
    }
  };

  const handleClearAll = () => {
    if (confirm('Alle Regeln löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      clearRules(brandId);
    }
  };

  return (
    <div className="rules-manager">
      {/* Stats Overview */}
      <div className="manager-stats">
        <div className="stat-card">
          <span className="stat-value">{summary.total}</span>
          <span className="stat-label">Regeln gesamt</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{summary.confirmed}</span>
          <span className="stat-label">Bestätigt</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{summary.byCategory.color}</span>
          <span className="stat-label">Farben</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{summary.byCategory.typography}</span>
          <span className="stat-label">Typografie</span>
        </div>
      </div>

      {/* Extracted Assets Preview */}
      {assets.logos && assets.logos.length > 0 && (
        <div className="extracted-assets">
          <h3>Extrahierte Logos</h3>
          <div className="asset-grid">
            {assets.logos.slice(0, 4).map((logo, i) => (
              <div key={i} className="asset-item">
                {logo.data ? (
                  <img src={logo.data} alt={logo.name || 'Logo'} />
                ) : (
                  <div className="asset-placeholder">{logo.name}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="manager-actions">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Alle
          </button>
          {Object.entries(categoryLabels).map(([key, { label }]) => (
            <button
              key={key}
              className={`filter-tab ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="action-buttons">
          <button className="btn-text" onClick={() => setShowImportModal(true)}>
            Importieren
          </button>
          <button className="btn-text" onClick={handleExport}>
            Exportieren
          </button>
          <button className="btn-text danger" onClick={handleClearAll}>
            Alle löschen
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="rules-list">
        {filteredRules.length === 0 ? (
          <div className="empty-state">
            <p>Keine Regeln in dieser Kategorie</p>
          </div>
        ) : (
          filteredRules.map(rule => (
            <div key={rule.id} className="rule-item">
              <div className="rule-icon">
                {categoryLabels[rule.category]?.icon || '?'}
              </div>
              <div className="rule-content">
                <div className="rule-name">{rule.name}</div>
                <div className="rule-desc">{rule.description}</div>
              </div>
              <div className="rule-preview">
                {rule.value?.color && (
                  <span
                    className="color-preview"
                    style={{ backgroundColor: rule.value.color }}
                  />
                )}
                {rule.value?.fontFamily && (
                  <span className="font-preview">
                    {rule.value.fontFamily}
                  </span>
                )}
              </div>
              <div className="rule-confidence">
                {Math.round(rule.confidence * 100)}%
              </div>
              <button
                className="btn-remove"
                onClick={() => deleteRule(brandId, rule.id)}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* Info Footer */}
      <div className="manager-footer">
        <p>
          Diese Regeln werden automatisch auf neue Assets angewendet und in AI-Generierungen berücksichtigt.
        </p>
        <button className="btn-secondary" onClick={onReanalyze}>
          Assets neu analysieren
        </button>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Regeln importieren</h3>
              <button onClick={() => setShowImportModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="JSON hier einfügen..."
                rows={10}
              />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowImportModal(false)}>
                Abbrechen
              </button>
              <button className="btn-primary" onClick={handleImport}>
                Importieren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
