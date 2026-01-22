import React from 'react';

export default function AnalysisProgress({ progress, message }) {
  return (
    <div className="analysis-progress">
      <div className="progress-visual">
        <div className="progress-circle">
          <svg viewBox="0 0 100 100">
            <circle
              className="progress-bg"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
            />
            <circle
              className="progress-fill"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
              strokeDasharray={`${progress * 2.83} 283`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="progress-value">{progress}%</div>
        </div>
      </div>

      <div className="progress-info">
        <h3>Analysiere Brand-Assets...</h3>
        <p className="progress-message">{message}</p>

        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="progress-steps">
          <div className={`step ${progress >= 10 ? 'done' : progress > 0 ? 'active' : ''}`}>
            <span className="step-icon">{progress >= 10 ? '✓' : '1'}</span>
            <span className="step-label">Dateien laden</span>
          </div>
          <div className={`step ${progress >= 40 ? 'done' : progress >= 10 ? 'active' : ''}`}>
            <span className="step-icon">{progress >= 40 ? '✓' : '2'}</span>
            <span className="step-label">Farben & Fonts</span>
          </div>
          <div className={`step ${progress >= 70 ? 'done' : progress >= 40 ? 'active' : ''}`}>
            <span className="step-icon">{progress >= 70 ? '✓' : '3'}</span>
            <span className="step-label">Patterns erkennen</span>
          </div>
          <div className={`step ${progress >= 100 ? 'done' : progress >= 70 ? 'active' : ''}`}>
            <span className="step-icon">{progress >= 100 ? '✓' : '4'}</span>
            <span className="step-label">Regeln generieren</span>
          </div>
        </div>
      </div>

      <p className="progress-tip">
        Je mehr Assets du hochlädst, desto genauer werden die erkannten Regeln.
      </p>
    </div>
  );
}
