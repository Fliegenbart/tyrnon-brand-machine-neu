import React from 'react';

const toneOptions = [
  { value: 'professional', label: 'Professionell', description: 'Seriös, kompetent, vertrauenswürdig' },
  { value: 'friendly', label: 'Freundlich', description: 'Warm, einladend, zugänglich' },
  { value: 'innovative', label: 'Innovativ', description: 'Modern, zukunftsorientiert, kreativ' },
  { value: 'premium', label: 'Premium', description: 'Exklusiv, hochwertig, anspruchsvoll' },
  { value: 'playful', label: 'Verspielt', description: 'Locker, humorvoll, ungezwungen' },
  { value: 'trustworthy', label: 'Vertrauensvoll', description: 'Zuverlässig, ehrlich, transparent' },
];

const formalityOptions = [
  { value: 'du', label: 'Du', description: 'Informell, persönlich' },
  { value: 'sie', label: 'Sie', description: 'Formell, respektvoll' },
  { value: 'wir', label: 'Wir', description: 'Inklusiv, gemeinschaftlich' },
];

export default function VoiceEditor({ voice, onChange }) {
  const handleChange = (key, value) => {
    onChange({ ...voice, [key]: value });
  };

  return (
    <div className="voice-editor">
      <h3>Brand Voice</h3>
      <p className="editor-description">
        Definiere wie deine Marke kommuniziert. Diese Einstellungen beeinflussen die AI-Textgenerierung.
      </p>

      <div className="voice-sections">
        <div className="voice-section">
          <h4>Tonalität</h4>
          <p className="section-description">Wie soll sich deine Marke anfühlen?</p>
          <div className="tone-grid">
            {toneOptions.map(option => (
              <button
                key={option.value}
                className={`tone-option ${voice.tone === option.value ? 'selected' : ''}`}
                onClick={() => handleChange('tone', option.value)}
              >
                <span className="tone-label">{option.label}</span>
                <span className="tone-description">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="voice-section">
          <h4>Ansprache</h4>
          <p className="section-description">Wie spricht deine Marke Kunden an?</p>
          <div className="formality-options">
            {formalityOptions.map(option => (
              <button
                key={option.value}
                className={`formality-option ${voice.formality === option.value ? 'selected' : ''}`}
                onClick={() => handleChange('formality', option.value)}
              >
                <span className="formality-label">{option.label}</span>
                <span className="formality-description">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="voice-section">
          <h4>Tagline</h4>
          <p className="section-description">Der Slogan deiner Marke</p>
          <input
            type="text"
            className="tagline-input"
            value={voice.tagline || ''}
            onChange={(e) => handleChange('tagline', e.target.value)}
            placeholder="z.B. Innovation trifft Zuverlässigkeit"
          />
        </div>

        <div className="voice-section">
          <h4>Wording Guidelines</h4>

          <div className="guidelines-group">
            <label>Do's - Bevorzugte Begriffe</label>
            <textarea
              value={voice.dos || ''}
              onChange={(e) => handleChange('dos', e.target.value)}
              placeholder="innovativ, nachhaltig, partnerschaftlich, Lösung, Mehrwert..."
              rows={3}
            />
            <p className="guidelines-hint">Komma-getrennte Liste von Wörtern die verwendet werden sollen</p>
          </div>

          <div className="guidelines-group">
            <label>Don'ts - Vermeidene Begriffe</label>
            <textarea
              value={voice.donts || ''}
              onChange={(e) => handleChange('donts', e.target.value)}
              placeholder="billig, Problem, eigentlich, vielleicht, irgendwie..."
              rows={3}
            />
            <p className="guidelines-hint">Komma-getrennte Liste von Wörtern die vermieden werden sollen</p>
          </div>
        </div>

        <div className="voice-preview">
          <h4>Vorschau</h4>
          <div className="voice-preview-card">
            <p className="voice-preview-label">So könnte deine Marke sprechen:</p>
            <blockquote className="voice-sample">
              {voice.formality === 'du' && (
                <>
                  "Hey, schön dass du hier bist! {voice.tone === 'innovative' && 'Wir denken Dinge gerne neu.'} {voice.tone === 'professional' && 'Hier findest du echte Expertise.'} {voice.tone === 'friendly' && 'Wir freuen uns auf dich!'} {voice.tone === 'premium' && 'Erlebe Qualität auf höchstem Niveau.'}"
                </>
              )}
              {voice.formality === 'sie' && (
                <>
                  "Willkommen. {voice.tone === 'innovative' && 'Wir gestalten die Zukunft.'} {voice.tone === 'professional' && 'Vertrauen Sie auf unsere Expertise.'} {voice.tone === 'friendly' && 'Wir beraten Sie gerne.'} {voice.tone === 'premium' && 'Erleben Sie exzellente Qualität.'}"
                </>
              )}
              {voice.formality === 'wir' && (
                <>
                  "Gemeinsam {voice.tone === 'innovative' && 'schaffen wir Neues.'} {voice.tone === 'professional' && 'erreichen wir Ihre Ziele.'} {voice.tone === 'friendly' && 'machen wir das möglich.'} {voice.tone === 'premium' && 'setzen wir neue Maßstäbe.'}"
                </>
              )}
            </blockquote>
            {voice.tagline && (
              <p className="voice-tagline-preview">
                <strong>Tagline:</strong> {voice.tagline}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
