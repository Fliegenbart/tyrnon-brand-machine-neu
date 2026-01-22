import React from 'react';
import { generateCompleteAsset, assetStructures } from '../../lib/ai.js';

/**
 * GenerateStep - Select asset type and generate content
 * Shows extracted brand summary, asset type selection, optional briefing
 */
export default function GenerateStep({
  brand,
  assetType,
  setAssetType,
  briefing,
  setBriefing,
  onComplete,
  onBack,
  isGenerating,
  setIsGenerating,
  setError
}) {
  const assetTypes = [
    { id: 'website', name: 'Website', icon: 'W', description: 'Landingpage mit Hero, Features, CTA' },
    { id: 'flyer', name: 'Flyer', icon: 'F', description: 'Print-Flyer oder Broschüre' },
    { id: 'social', name: 'Social', icon: 'S', description: '5 Social Media Posts' },
    { id: 'email', name: 'E-Mail', icon: 'E', description: 'Newsletter oder E-Mail' },
    { id: 'presentation', name: 'PPT', icon: 'P', description: '10-Slide Präsentation' },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Use default briefing if none provided
      const actualBriefing = briefing.trim() || `Allgemeiner Content für ${brand.name || 'die Marke'}`;

      const content = await generateCompleteAsset(brand, assetType, actualBriefing, null);

      // Parse generated content for preview
      const parsedContent = parseGeneratedContent(content, assetType);

      onComplete({
        raw: content,
        parsed: parsedContent
      });
    } catch (err) {
      console.error('Generation failed:', err);
      setError(err.message || 'Generierung fehlgeschlagen');
    }

    setIsGenerating(false);
  };

  // Parse generated text into structured content for preview
  const parseGeneratedContent = (text, type) => {
    const lines = text.split('\n').filter(l => l.trim());

    // Extract headline
    let headline = '';
    const headlineMatch = text.match(/(?:headline|überschrift|hero|titel)[:\s]*[*]*([^*\n]+)/i);
    if (headlineMatch) {
      headline = headlineMatch[1].trim();
    } else {
      // Take first non-empty line that looks like a headline
      const firstLine = lines.find(l => !l.startsWith('#') && !l.startsWith('-') && l.length < 100);
      headline = firstLine?.replace(/^[\d.\-*]+\s*/, '') || 'Willkommen';
    }

    // Extract subline
    let subline = '';
    const sublineMatch = text.match(/(?:subline|untertitel|sub)[:\s]*[*]*([^*\n]+)/i);
    if (sublineMatch) {
      subline = sublineMatch[1].trim();
    }

    // Extract CTA
    let cta = 'Mehr erfahren';
    const ctaMatch = text.match(/(?:cta|button|call.to.action)[:\s]*[*]*([^*\n]+)/i);
    if (ctaMatch) {
      cta = ctaMatch[1].trim();
    }

    return {
      headline,
      subline,
      cta,
      body: text,
      fields: {
        headline: { value: headline },
        body: { value: text }
      }
    };
  };

  return (
    <div className="generate-step">
      <div className="generate-content">
        {/* Brand Summary */}
        <div className="brand-summary">
          <h3>Deine Brand CI</h3>
          <div className="brand-summary-content">
            <div className="brand-colors">
              <div
                className="color-dot"
                style={{ backgroundColor: brand.colors.primary }}
                title="Primary"
              />
              <div
                className="color-dot"
                style={{ backgroundColor: brand.colors.secondary }}
                title="Secondary"
              />
              <div
                className="color-dot"
                style={{ backgroundColor: brand.colors.accent }}
                title="Accent"
              />
            </div>
            {brand.logo && (
              <div className="brand-logo-mini">
                <img src={brand.logo} alt="Logo" />
              </div>
            )}
            {brand.toneOfVoice && (
              <div className="brand-tone">
                <span className="tone-label">Stil:</span>
                <span className="tone-value">
                  {brand.voice?.tone === 'professional' ? 'Professionell' :
                   brand.voice?.tone === 'friendly' ? 'Freundlich' :
                   brand.voice?.tone === 'innovative' ? 'Innovativ' :
                   brand.voice?.tone === 'premium' ? 'Premium' :
                   brand.voice?.tone === 'playful' ? 'Spielerisch' :
                   brand.voice?.tone === 'trustworthy' ? 'Vertrauenswürdig' :
                   'Professionell'}
                </span>
              </div>
            )}
          </div>
          <button className="btn-edit-brand" onClick={onBack}>
            Andere Datei hochladen
          </button>
        </div>

        {/* Asset Type Selection */}
        <div className="asset-selection">
          <h2>Was möchtest du erstellen?</h2>
          <div className="asset-grid">
            {assetTypes.map(asset => (
              <button
                key={asset.id}
                className={`asset-card ${assetType === asset.id ? 'selected' : ''}`}
                onClick={() => setAssetType(asset.id)}
              >
                <span className="asset-card-icon">{asset.icon}</span>
                <span className="asset-card-name">{asset.name}</span>
                <span className="asset-card-desc">{asset.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Briefing */}
        <div className="briefing-section">
          <label htmlFor="briefing">Optional: Kurze Beschreibung</label>
          <input
            id="briefing"
            type="text"
            value={briefing}
            onChange={(e) => setBriefing(e.target.value)}
            placeholder="z.B. Landingpage für neuen E-Auto Service"
            disabled={isGenerating}
          />
        </div>

        {/* Generate Button */}
        <button
          className="btn-generate-main"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="generating-spinner"></span>
              <span>Generiere {assetStructures[assetType]?.name || 'Content'}...</span>
            </>
          ) : (
            <>
              <span className="generate-icon">*</span>
              <span>Generieren</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
