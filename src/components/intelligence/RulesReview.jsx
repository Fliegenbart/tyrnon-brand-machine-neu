import React from 'react';
import { useRulesStore } from '../../stores/rulesStore';

const categoryLabels = {
  color: { label: 'Farben', icon: 'C' },
  typography: { label: 'Typografie', icon: 'T' },
  spacing: { label: 'Abstände', icon: 'S' },
  component: { label: 'Komponenten', icon: 'K' }
};

const confidenceColors = {
  high: '#22c55e',    // >= 0.8
  medium: '#f59e0b',  // >= 0.6
  low: '#ef4444'      // < 0.6
};

function getConfidenceColor(confidence) {
  if (confidence >= 0.8) return confidenceColors.high;
  if (confidence >= 0.6) return confidenceColors.medium;
  return confidenceColors.low;
}

function getConfidenceLabel(confidence) {
  if (confidence >= 0.9) return 'Sehr sicher';
  if (confidence >= 0.7) return 'Sicher';
  if (confidence >= 0.5) return 'Unsicher';
  return 'Prüfen';
}

export default function RulesReview({ brandId, onConfirm, onBack }) {
  const {
    getRulesForBrand,
    confirmRule,
    deleteRule,
    updateRule,
    confirmAllRules
  } = useRulesStore();

  const rules = getRulesForBrand(brandId);

  // Group rules by category
  const groupedRules = rules.reduce((acc, rule) => {
    const cat = rule.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(rule);
    return acc;
  }, {});

  const handleConfirmAll = () => {
    confirmAllRules(brandId);
    onConfirm();
  };

  const handleConfirmSingle = (ruleId) => {
    confirmRule(brandId, ruleId);
  };

  const handleDelete = (ruleId) => {
    deleteRule(brandId, ruleId);
  };

  const handleUpdateValue = (ruleId, field, value) => {
    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      updateRule(brandId, ruleId, {
        value: { ...rule.value, [field]: value }
      });
    }
  };

  if (rules.length === 0) {
    return (
      <div className="rules-review empty">
        <div className="empty-state">
          <span className="empty-icon">?</span>
          <h3>Keine Regeln erkannt</h3>
          <p>Es konnten keine Brand-Regeln aus den hochgeladenen Dateien extrahiert werden.</p>
          <button className="btn-secondary" onClick={onBack}>
            Andere Dateien hochladen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rules-review">
      <div className="review-header">
        <div className="review-summary">
          <h2>{rules.length} Regeln erkannt</h2>
          <p>Prüfe die erkannten Regeln und bestätige oder passe sie an.</p>
        </div>
        <div className="review-actions">
          <button className="btn-secondary" onClick={onBack}>
            Zurück
          </button>
          <button className="btn-primary" onClick={handleConfirmAll}>
            Alle bestätigen
          </button>
        </div>
      </div>

      <div className="rules-categories">
        {Object.entries(groupedRules).map(([category, categoryRules]) => (
          <div key={category} className="rule-category">
            <div className="category-header">
              <span className="category-icon">
                {categoryLabels[category]?.icon || '?'}
              </span>
              <h3>{categoryLabels[category]?.label || category}</h3>
              <span className="category-count">{categoryRules.length}</span>
            </div>

            <div className="category-rules">
              {categoryRules.map(rule => (
                <div
                  key={rule.id}
                  className={`rule-card ${rule.confirmed ? 'confirmed' : ''}`}
                >
                  <div className="rule-header">
                    <div className="rule-title">
                      <h4>{rule.name}</h4>
                      <div
                        className="confidence-badge"
                        style={{
                          backgroundColor: getConfidenceColor(rule.confidence),
                          color: 'white'
                        }}
                      >
                        {Math.round(rule.confidence * 100)}% {getConfidenceLabel(rule.confidence)}
                      </div>
                    </div>
                    <div className="rule-actions">
                      {!rule.confirmed && (
                        <button
                          className="btn-confirm"
                          onClick={() => handleConfirmSingle(rule.id)}
                          title="Bestätigen"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(rule.id)}
                        title="Löschen"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <p className="rule-description">{rule.description}</p>

                  {/* Value preview */}
                  <div className="rule-value">
                    {rule.value?.color && (
                      <div className="value-color">
                        <span
                          className="color-swatch"
                          style={{ backgroundColor: rule.value.color }}
                        />
                        <input
                          type="text"
                          value={rule.value.color}
                          onChange={(e) => handleUpdateValue(rule.id, 'color', e.target.value)}
                          className="color-input"
                        />
                      </div>
                    )}

                    {rule.value?.fontFamily && (
                      <div className="value-font">
                        <span
                          className="font-preview"
                          style={{ fontFamily: rule.value.fontFamily }}
                        >
                          Aa
                        </span>
                        <span className="font-name">{rule.value.fontFamily}</span>
                      </div>
                    )}

                    {rule.value?.textTransform && (
                      <div className="value-transform">
                        <span className="transform-preview" style={{ textTransform: rule.value.textTransform }}>
                          Beispiel
                        </span>
                      </div>
                    )}

                    {rule.value?.baseUnit && (
                      <div className="value-spacing">
                        <span className="spacing-unit">{rule.value.baseUnit}px</span>
                        <span className="spacing-scale">
                          Scale: {rule.value.scale?.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sources */}
                  {rule.sources && rule.sources.length > 0 && (
                    <div className="rule-sources">
                      <span className="sources-label">Quellen:</span>
                      {rule.sources.slice(0, 3).map((source, i) => (
                        <span key={i} className="source-tag">
                          {source.file}
                        </span>
                      ))}
                      {rule.sources.length > 3 && (
                        <span className="source-more">
                          +{rule.sources.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="review-footer">
        <button className="btn-secondary" onClick={onBack}>
          Abbrechen
        </button>
        <button className="btn-primary btn-large" onClick={handleConfirmAll}>
          {rules.length} Regeln übernehmen
        </button>
      </div>
    </div>
  );
}
