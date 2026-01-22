import React, { useState } from 'react';
import { generateCompleteAsset, generateImage, scrapeWebsite, assetStructures } from '../lib/ai.js';

export default function AIStudio({ brand, selectedAsset, onApplyContent }) {
  const [activeTab, setActiveTab] = useState('ai');
  const [briefing, setBriefing] = useState('');

  // Multiple URLs support
  const [urls, setUrls] = useState(['']);
  const [scrapedContents, setScrapedContents] = useState([]);
  const [scrapingIndex, setScrapingIndex] = useState(-1);

  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Image generation state
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState('modern');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const currentAsset = assetStructures[selectedAsset];

  // URL handling
  const addUrlField = () => {
    if (urls.length < 5) {
      setUrls([...urls, '']);
    }
  };

  const updateUrl = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const removeUrl = (index) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      setUrls(newUrls);
      // Also remove corresponding scraped content
      const newContents = scrapedContents.filter((_, i) => i !== index);
      setScrapedContents(newContents);
    }
  };

  const handleScrapeUrl = async (index) => {
    const url = urls[index];
    if (!url.trim()) return;

    setScrapingIndex(index);
    setError(null);

    try {
      const content = await scrapeWebsite(url);
      const newContents = [...scrapedContents];
      newContents[index] = { url, content };
      setScrapedContents(newContents);
    } catch (err) {
      setError(`Fehler beim Scannen von ${url}: ${err.message}`);
    }

    setScrapingIndex(-1);
  };

  const handleScrapeAll = async () => {
    const validUrls = urls.filter(url => url.trim());
    if (validUrls.length === 0) return;

    setError(null);
    const newContents = [];

    for (let i = 0; i < urls.length; i++) {
      if (urls[i].trim()) {
        setScrapingIndex(i);
        try {
          const content = await scrapeWebsite(urls[i]);
          newContents[i] = { url: urls[i], content };
        } catch (err) {
          newContents[i] = { url: urls[i], error: err.message };
        }
      }
    }

    setScrapedContents(newContents);
    setScrapingIndex(-1);
  };

  const removeScrapedContent = (index) => {
    const newContents = [...scrapedContents];
    newContents[index] = null;
    setScrapedContents(newContents);
  };

  const handleGenerate = async () => {
    if (!briefing.trim()) {
      setError('Bitte gib ein Briefing ein');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Combine all scraped contents
      const combinedContent = scrapedContents
        .filter(sc => sc?.content)
        .map(sc => `[Quelle: ${sc.url}]\n${sc.content}`)
        .join('\n\n---\n\n');

      const text = await generateCompleteAsset(brand, selectedAsset, briefing, combinedContent || null);
      setGeneratedText(text);

      // Auto-apply to preview
      if (onApplyContent && text) {
        onApplyContent(text);
      }
    } catch (err) {
      setError(err.message);
    }

    setIsGenerating(false);
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      setError('Bitte beschreibe das gewünschte Bild');
      return;
    }

    setIsGeneratingImage(true);
    setError(null);

    try {
      const image = await generateImage(imagePrompt, brand, imageStyle);
      setGeneratedImage(image);
    } catch (err) {
      setError(err.message);
    }

    setIsGeneratingImage(false);
  };

  const handleApplyText = () => {
    if (onApplyContent && generatedText) {
      onApplyContent(generatedText);
    }
  };

  const useScrapedInBriefing = (content) => {
    setBriefing(prev => {
      const addition = content.slice(0, 1500);
      return prev ? `${prev}\n\n---\nWebsite-Kontext:\n${addition}` : `Website-Kontext:\n${addition}`;
    });
  };

  const tabs = [
    { id: 'ai', label: 'AI Studio', icon: '✦' },
    { id: 'content', label: 'Inhalt', icon: '✎' },
    { id: 'media', label: 'Medien', icon: '▣' },
  ];

  const hasValidUrls = urls.some(url => url.trim());
  const hasScrapedContent = scrapedContents.some(sc => sc?.content);
  const isScraping = scrapingIndex >= 0;

  return (
    <div className="ai-studio">
      {/* Tab Navigation */}
      <div className="ai-studio-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`ai-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="ai-tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="ai-error">
          <span className="error-icon">!</span>
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* AI Studio Tab */}
      {activeTab === 'ai' && (
        <div className="ai-panel">
          {/* Website Sources Section */}
          <div className="ai-section ai-sources-section">
            <div className="section-header">
              <h4>Website-Quellen</h4>
              <span className="section-hint">Analysiere bestehende Websites als Inspiration</span>
            </div>

            <div className="url-inputs">
              {urls.map((url, index) => (
                <div key={index} className="url-input-row">
                  <div className={`url-input-wrapper ${scrapingIndex === index ? 'scanning' : ''}`}>
                    <span className="url-prefix">URL</span>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateUrl(index, e.target.value)}
                      placeholder="https://beispiel.de"
                      disabled={isScraping}
                    />
                    {scrapingIndex === index && (
                      <div className="scanning-indicator">
                        <div className="scanning-spinner"></div>
                        <span>Scanne...</span>
                      </div>
                    )}
                    {scrapedContents[index]?.content && scrapingIndex !== index && (
                      <span className="url-status success">✓</span>
                    )}
                  </div>
                  <button
                    className="btn-scan-single"
                    onClick={() => handleScrapeUrl(index)}
                    disabled={isScraping || !url.trim()}
                    title="Diese URL scannen"
                  >
                    Scan
                  </button>
                  {urls.length > 1 && (
                    <button
                      className="btn-remove-url"
                      onClick={() => removeUrl(index)}
                      disabled={isScraping}
                      title="Entfernen"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="url-actions">
              {urls.length < 5 && (
                <button className="btn-add-url" onClick={addUrlField} disabled={isScraping}>
                  + URL hinzufügen
                </button>
              )}
              {hasValidUrls && urls.filter(u => u.trim()).length > 1 && (
                <button
                  className="btn-scan-all"
                  onClick={handleScrapeAll}
                  disabled={isScraping}
                >
                  {isScraping ? (
                    <>
                      <div className="btn-spinner"></div>
                      Scanne {scrapingIndex + 1}/{urls.filter(u => u.trim()).length}...
                    </>
                  ) : (
                    'Alle scannen'
                  )}
                </button>
              )}
            </div>

            {/* Scraped Content Cards */}
            {hasScrapedContent && (
              <div className="scraped-contents">
                {scrapedContents.map((sc, index) => sc?.content && (
                  <div key={index} className="scraped-card">
                    <div className="scraped-card-header">
                      <span className="scraped-url" title={sc.url}>
                        {new URL(sc.url).hostname}
                      </span>
                      <div className="scraped-card-actions">
                        <button
                          className="btn-use"
                          onClick={() => useScrapedInBriefing(sc.content)}
                          title="In Briefing übernehmen"
                        >
                          Nutzen
                        </button>
                        <button
                          className="btn-close-small"
                          onClick={() => removeScrapedContent(index)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div className="scraped-card-preview">
                      {sc.content.slice(0, 300)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Briefing Section */}
          <div className="ai-section ai-briefing-section">
            <div className="section-header">
              <h4>Briefing</h4>
              <span className="section-hint">Beschreibe was du brauchst</span>
            </div>
            <textarea
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              placeholder={`Was soll erstellt werden?

Beispiele:
• "Landingpage für SaaS-Produkt zur Zeiterfassung"
• "Social Media Kampagne für Frühlingsrabatt 20%"
• "Newsletter für Webinar-Ankündigung am 15. März"`}
              rows={4}
              disabled={isGenerating}
              className="briefing-textarea"
            />
          </div>

          {/* Generate Button */}
          <button
            className="btn-generate"
            onClick={handleGenerate}
            disabled={isGenerating || !briefing.trim()}
          >
            {isGenerating ? (
              <div className="generating-state">
                <div className="generating-spinner"></div>
                <span>Generiere {currentAsset?.name || 'Content'}...</span>
                <div className="generating-progress"></div>
              </div>
            ) : (
              <>
                <span className="btn-icon">✦</span>
                <span>Generiere {currentAsset?.name || 'Content'}</span>
              </>
            )}
          </button>

          {/* Generated Result */}
          {generatedText && (
            <div className="ai-result">
              <div className="ai-result-header">
                <h4>Generierter Content</h4>
                <div className="ai-result-actions">
                  <button
                    className="btn-copy"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedText);
                    }}
                  >
                    Kopieren
                  </button>
                  <button className="btn-apply" onClick={handleApplyText}>
                    Übernehmen
                  </button>
                </div>
              </div>
              <div className="ai-result-content">
                <pre>{generatedText}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="ai-panel">
          <div className="ai-section">
            <div className="section-header">
              <h4>Inhalt bearbeiten</h4>
            </div>
            <p className="empty-state-text">
              Wähle ein Asset aus und bearbeite den Inhalt direkt im Editor.
            </p>
          </div>
        </div>
      )}

      {/* Media Tab */}
      {activeTab === 'media' && (
        <div className="ai-panel">
          <div className="ai-section">
            <div className="section-header">
              <h4>Bild generieren</h4>
              <span className="section-hint">KI-generierte Bilder für dein Asset</span>
            </div>
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder={`Beschreibe das gewünschte Bild...

Beispiele:
• "Hero-Bild für Tech-Startup, Person am Laptop"
• "Abstrakte Grafik, grüne Elemente, Nachhaltigkeit"
• "Team-Meeting, professionell, diverse Gruppe"`}
              rows={3}
              disabled={isGeneratingImage}
              className="image-prompt-textarea"
            />
          </div>

          <div className="ai-section">
            <div className="section-header">
              <h4>Stil</h4>
            </div>
            <div className="style-options">
              {[
                { id: 'modern', label: 'Modern' },
                { id: 'corporate', label: 'Corporate' },
                { id: 'creative', label: 'Kreativ' },
                { id: 'photo', label: 'Foto' },
                { id: 'illustration', label: 'Illustration' },
              ].map(style => (
                <button
                  key={style.id}
                  className={`style-btn ${imageStyle === style.id ? 'active' : ''}`}
                  onClick={() => setImageStyle(style.id)}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn-generate"
            onClick={handleGenerateImage}
            disabled={isGeneratingImage || !imagePrompt.trim()}
          >
            {isGeneratingImage ? (
              <div className="generating-state">
                <div className="generating-spinner"></div>
                <span>Generiere Bild...</span>
              </div>
            ) : (
              <>
                <span className="btn-icon">▣</span>
                <span>Bild generieren</span>
              </>
            )}
          </button>

          {generatedImage && (
            <div className="ai-image-result">
              <div className="ai-result-header">
                <h4>Generiertes Bild</h4>
                <a
                  href={generatedImage}
                  download="generated-image.png"
                  className="btn-download"
                >
                  Download
                </a>
              </div>
              <div className="image-preview">
                <img src={generatedImage} alt="Generated" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
