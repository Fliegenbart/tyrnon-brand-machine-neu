import React, { useState } from 'react';
import { searchUnsplash, imageCategories } from '../lib/images.js';

export default function ImagePicker({ brand, onSelectImage }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('unsplash_api_key') || '');

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const data = await searchUnsplash(searchQuery, { apiKey: apiKey || null });
      setResults(data.results);
    } catch (error) {
      console.error('Search failed:', error);
    }
    setIsSearching(false);
  };

  return (
    <div className="image-picker">
      <div className="image-picker-header">
        <h3>Bilder</h3>
      </div>

      <div className="image-search">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Bilder suchen..."
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={() => handleSearch()} disabled={isSearching}>
          {isSearching ? '...' : 'Suchen'}
        </button>
      </div>

      <div className="image-categories">
        {imageCategories.slice(0, 4).map(cat => (
          <button
            key={cat.id}
            onClick={() => { setQuery(cat.query); handleSearch(cat.query); }}
            className="category-btn"
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="image-grid">
        {results.map(img => (
          <div
            key={img.id}
            className="image-item"
            onClick={() => onSelectImage && onSelectImage(img)}
          >
            <img src={img.urls.thumb} alt={img.alt} loading="lazy" />
            <div className="image-overlay">
              <span>Auswahlen</span>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && !isSearching && (
        <div className="image-empty">
          Suche nach Bildern oder wahle eine Kategorie
        </div>
      )}

      <details className="image-settings">
        <summary>Unsplash API Key</summary>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            localStorage.setItem('unsplash_api_key', e.target.value);
          }}
          placeholder="Access Key..."
        />
      </details>
    </div>
  );
}
