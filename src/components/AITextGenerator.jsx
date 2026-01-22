import React, { useState } from 'react';
import { generateText, textTypes } from '../lib/ai.js';

export default function AITextGenerator({ brand, onInsertText }) {
  const [selectedType, setSelectedType] = useState('headline');
  const [topic, setTopic] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '');

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      const text = await generateText(brand, selectedType, topic, apiKey || null);
      setGeneratedText(text);
    } catch (error) {
      console.error('Generation failed:', error);
      setGeneratedText('Fehler bei der Generierung. Bitte versuche es erneut.');
    }
    setIsGenerating(false);
  };

  const saveApiKey = (key) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('openai_api_key', key);
    } else {
      localStorage.removeItem('openai_api_key');
    }
  };

  return (
    <div className="ai-generator">
      <div className="ai-header">
        <h3>AI Text-Generator</h3>
        <span className="ai-badge">Brand Voice</span>
      </div>

      <div className="ai-type-selector">
        {Object.entries(textTypes).map(([key, type]) => (
          <button
            key={key}
            className={`ai-type-btn ${selectedType === key ? 'active' : ''}`}
            onClick={() => setSelectedType(key)}
          >
            <span>{type.icon}</span>
            <span>{type.name}</span>
          </button>
        ))}
      </div>

      <div className="ai-input-area">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={textTypes[selectedType].placeholder}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className="btn-generate"
        >
          {isGenerating ? 'Generiere...' : 'Generieren'}
        </button>
      </div>

      {generatedText && (
        <div className="ai-result">
          <div className="ai-result-header">
            <span>Generierter Text</span>
            <div className="ai-result-actions">
              <button onClick={() => navigator.clipboard.writeText(generatedText)}>Kopieren</button>
              <button onClick={() => onInsertText && onInsertText(generatedText)}>Einfugen</button>
            </div>
          </div>
          <pre className="ai-result-text">{generatedText}</pre>
        </div>
      )}

      <details className="ai-settings">
        <summary>API-Einstellungen</summary>
        <div className="api-key-input">
          <label>OpenAI API Key (optional fur echte AI)</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => saveApiKey(e.target.value)}
            placeholder="sk-..."
          />
          <small>Ohne Key werden Demo-Texte generiert</small>
        </div>
      </details>
    </div>
  );
}
