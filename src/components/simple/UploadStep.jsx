import React, { useState, useCallback } from 'react';
import { analyzeWithAI } from '../../lib/analyzer/ai-analyzer.js';

/**
 * UploadStep - Drag & drop zone for brand documents
 * Supports PDF, PPTX, PNG/JPG
 * Automatically analyzes with AI after upload
 */
export default function UploadStep({ onComplete, isAnalyzing, setIsAnalyzing, setError }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const acceptedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg',
    'image/svg+xml'
  ];

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  }, []);

  const handleFiles = async (files) => {
    // Filter to accepted types
    const validFiles = files.filter(file =>
      acceptedTypes.some(type => file.type === type) ||
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.pptx')
    );

    if (validFiles.length === 0) {
      setError('Bitte lade PDF, PPTX oder Bilder (PNG/JPG) hoch.');
      return;
    }

    setUploadedFiles(validFiles);
    await startAnalysis(validFiles);
  };

  const startAnalysis = async (files) => {
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);

    try {
      // Filter files for AI analysis (PDF and images only)
      const aiFiles = files.filter(f =>
        f.type === 'application/pdf' ||
        f.type.startsWith('image/') ||
        f.name.toLowerCase().endsWith('.pdf')
      );

      if (aiFiles.length === 0) {
        // If only PPTX, we need a different approach
        // For now, show a message
        setError('PDF oder Bild benötigt für AI-Analyse. PPTX wird aktuell nur für Themes unterstützt.');
        setIsAnalyzing(false);
        return;
      }

      const result = await analyzeWithAI(aiFiles, (p) => {
        setProgress(p);
        if (p < 20) setProgressMessage('Dokumente werden vorbereitet...');
        else if (p < 50) setProgressMessage('Dokumente werden hochgeladen...');
        else if (p < 80) setProgressMessage('KI analysiert Brand-Elemente...');
        else setProgressMessage('Ergebnisse werden verarbeitet...');
      });

      // Transform result to brand format
      const extractedBrand = {
        colors: {},
        fonts: {},
        voice: {},
        logo: null,
        toneOfVoice: result.toneOfVoice || null
      };

      // Map colors to brand structure
      if (result.colors && result.colors.length > 0) {
        const colorsByRole = {};
        result.colors.forEach(c => {
          if (c.role) colorsByRole[c.role.toLowerCase()] = c.hex;
        });

        extractedBrand.colors = {
          primary: colorsByRole.primary || colorsByRole['primär'] || result.colors[0]?.hex || '#6366f1',
          secondary: colorsByRole.secondary || colorsByRole['sekundär'] || result.colors[1]?.hex || '#4f46e5',
          accent: colorsByRole.accent || colorsByRole['akzent'] || result.colors[2]?.hex || '#ec4899',
          background: colorsByRole.background || colorsByRole['hintergrund'] || '#ffffff',
          text: colorsByRole.text || '#1f2937'
        };
      }

      // Map fonts to brand structure
      if (result.fonts && result.fonts.length > 0) {
        const headingFont = result.fonts.find(f => f.usage === 'heading');
        const bodyFont = result.fonts.find(f => f.usage === 'body');

        extractedBrand.fonts = {
          heading: headingFont?.name ? `'${headingFont.name}', sans-serif` : "'DM Sans', sans-serif",
          body: bodyFont?.name ? `'${bodyFont.name}', sans-serif` : "'Inter', sans-serif"
        };
      }

      // Extract tone of voice
      if (result.toneOfVoice) {
        // Try to map tone of voice to our predefined options
        const toneText = result.toneOfVoice.toLowerCase();
        let tone = 'professional';
        if (toneText.includes('freund') || toneText.includes('warm')) tone = 'friendly';
        else if (toneText.includes('innovat')) tone = 'innovative';
        else if (toneText.includes('premium') || toneText.includes('exklusiv')) tone = 'premium';
        else if (toneText.includes('spiel') || toneText.includes('locker')) tone = 'playful';
        else if (toneText.includes('vertrau') || toneText.includes('seriös')) tone = 'trustworthy';

        extractedBrand.voice = {
          tone,
          formality: toneText.includes('du') ? 'du' : 'sie',
          tagline: ''
        };
      }

      setProgressMessage('Fertig!');
      setProgress(100);

      // Small delay to show completion
      setTimeout(() => {
        onComplete(extractedBrand);
      }, 500);

    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Analyse fehlgeschlagen');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="upload-step">
      <div className="upload-content">
        <h1>Brand-Dokument hochladen</h1>
        <p className="upload-subtitle">
          Lade dein Brand-PDF, Präsentation oder Logo hoch.
          Die KI extrahiert automatisch Farben, Schriften und Stil.
        </p>

        {!isAnalyzing ? (
          <div
            className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="dropzone-content">
              <div className="dropzone-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="dropzone-text">
                Datei hierher ziehen oder <span className="dropzone-link">durchsuchen</span>
              </p>
              <p className="dropzone-hint">PDF, PPTX, PNG, JPG oder SVG</p>
            </div>
            <input
              type="file"
              accept=".pdf,.pptx,.png,.jpg,.jpeg,.svg"
              onChange={handleFileInput}
              className="dropzone-input"
              multiple
            />
          </div>
        ) : (
          <div className="upload-progress">
            <div className="progress-content">
              <div className="progress-spinner">
                <svg className="spinner" viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
                </svg>
              </div>
              <p className="progress-message">{progressMessage}</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="progress-percent">{Math.round(progress)}%</p>
            </div>
          </div>
        )}

        {uploadedFiles.length > 0 && !isAnalyzing && (
          <div className="uploaded-files">
            {uploadedFiles.map((file, i) => (
              <div key={i} className="uploaded-file">
                <span className="file-icon">
                  {file.type.includes('pdf') ? 'PDF' :
                   file.type.includes('presentation') ? 'PPT' :
                   'IMG'}
                </span>
                <span className="file-name">{file.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
