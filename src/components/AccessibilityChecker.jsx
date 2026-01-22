import React from 'react';
import { checkBrandAccessibility, getAccessibilitySummary } from '../lib/accessibility.js';

export default function AccessibilityChecker({ brand }) {
  const results = checkBrandAccessibility(brand);
  const summary = getAccessibilitySummary(brand);

  return (
    <div className="accessibility-checker">
      <div className="a11y-header">
        <h3>Barrierefreiheit</h3>
        <div className="a11y-score" style={{ backgroundColor: summary.ratingColor }}>
          {summary.score}%
        </div>
      </div>

      <div className="a11y-rating">
        <span className="rating-label">{summary.rating}</span>
        <span className="rating-detail">
          {summary.passCount}/{summary.totalChecks} Checks bestanden
        </span>
      </div>

      <div className="a11y-checks">
        {results.checks.map((check, i) => (
          <div key={i} className={`a11y-check ${check.wcag.pass ? 'pass' : 'fail'}`}>
            <div className="check-colors">
              <span
                className="color-swatch"
                style={{ backgroundColor: check.foreground }}
              />
              <span className="color-arrow">→</span>
              <span
                className="color-swatch"
                style={{ backgroundColor: check.background }}
              />
            </div>
            <div className="check-info">
              <span className="check-name">{check.name}</span>
              <span className="check-ratio">{check.ratio.toFixed(1)}:1</span>
            </div>
            <span className={`check-level ${check.wcag.level.toLowerCase()}`}>
              {check.wcag.level}
            </span>
          </div>
        ))}
      </div>

      {results.errors.length > 0 && (
        <div className="a11y-errors">
          <h4>Probleme</h4>
          {results.errors.map((error, i) => (
            <div key={i} className="a11y-error">
              <p>{error.message}</p>
              <small>{error.suggestion}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
