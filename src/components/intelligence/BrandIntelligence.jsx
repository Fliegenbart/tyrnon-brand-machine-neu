import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBrandStore } from '../../stores/brandStore';
import { analyzeFiles } from '../../lib/analyzer/index.js';
import { aggregateExtraction } from '../../lib/analyzer/aggregator.js';
import { analyzeWithAI } from '../../lib/analyzer/ai-analyzer.js';
import AnalyzerUpload from './AnalyzerUpload';
import AnalysisProgress from './AnalysisProgress';
import BrandPreview from './BrandPreview';

export default function BrandIntelligence() {
  const { brandId } = useParams();
  const navigate = useNavigate();
  const { getBrandById, updateBrand } = useBrandStore();

  const brand = getBrandById(brandId);

  // Simplified flow: upload → analyzing → preview
  const [step, setStep] = useState('upload');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);

  const handleStartAnalysis = useCallback(async (files) => {
    setStep('analyzing');
    setProgress(0);
    setError(null);

    // Separate files by type
    const pptxFiles = files.filter(f => f.name.toLowerCase().endsWith('.pptx'));
    const aiFiles = files.filter(f =>
      f.type === 'application/pdf' ||
      f.type.startsWith('image/') ||
      f.name.toLowerCase().endsWith('.pdf')
    );

    try {
      let aggregated = { colors: [], fonts: [], logos: [] };

      // Use AI analysis for PDFs and images (much better at reading brand guidelines)
      if (aiFiles.length > 0) {
        setProgressMessage('KI analysiert Brand-Dokumente...');

        const aiResults = await analyzeWithAI(aiFiles, (p) => {
          setProgress(p * 0.7); // 0-70% for AI analysis
          if (p < 30) setProgressMessage('Dokumente werden gelesen...');
          else if (p < 70) setProgressMessage('KI extrahiert Brand-Elemente...');
          else setProgressMessage('Ergebnisse werden verarbeitet...');
        });

        // Merge AI results
        aggregated.colors = [...aggregated.colors, ...aiResults.colors];
        aggregated.fonts = [...aggregated.fonts, ...aiResults.fonts];
        aggregated.toneOfVoice = aiResults.toneOfVoice;
        aggregated.additionalNotes = aiResults.additionalNotes;
      }

      // Use basic analyzer for PPTX (good for theme extraction)
      if (pptxFiles.length > 0) {
        setProgressMessage('PPTX-Themes werden extrahiert...');

        const results = await analyzeFiles(pptxFiles, (p) => {
          setProgress(70 + p * 0.3); // 70-100% for PPTX
        });

        const pptxData = aggregateExtraction({
          pptx: results.analysis?.pptx || [],
          pdf: [],
          images: [],
          fonts: results.analysis?.fonts || []
        });

        // Merge PPTX results
        aggregated.colors = [...aggregated.colors, ...pptxData.colors];
        aggregated.fonts = [...aggregated.fonts, ...pptxData.fonts];

        // Add logos from PPTX
        if (results.extractedAssets?.logos?.length > 0) {
          aggregated.logos = [
            ...aggregated.logos,
            ...results.extractedAssets.logos.filter(l => l.dataUrl || l.data)
          ];
        }
        if (pptxData.logos?.length > 0) {
          aggregated.logos = [...aggregated.logos, ...pptxData.logos];
        }
      }

      // Deduplicate colors by similarity
      aggregated.colors = deduplicateColors(aggregated.colors);

      setProgress(100);
      setProgressMessage('Fertig!');
      setExtractedData(aggregated);
      setStep('preview');

    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Analyse fehlgeschlagen');
      setStep('upload');
    }
  }, []);

  // Helper to deduplicate similar colors
  const deduplicateColors = (colors) => {
    const unique = [];
    for (const color of colors) {
      const isDuplicate = unique.some(c => {
        if (!c.hex || !color.hex) return false;
        return colorDistance(c.hex, color.hex) < 20;
      });
      if (!isDuplicate) {
        unique.push(color);
      }
    }
    return unique;
  };

  const colorDistance = (hex1, hex2) => {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    if (!rgb1 || !rgb2) return Infinity;
    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const handleFigmaAnalysis = useCallback((analysis) => {
    // Convert Figma analysis to simple format for preview
    const aggregated = {
      colors: (analysis.colors || [])
        .filter(c => c.value)
        .map(c => ({
          hex: c.value,
          name: c.name,
          source: 'figma'
        })),
      fonts: (analysis.fonts || []).map(f => ({
        name: f.name,
        usage: f.weights ? 'heading' : 'body',
        source: 'figma'
      })),
      logos: (analysis.logos || []).map(l => ({
        dataUrl: l.url,
        name: l.name,
        source: 'figma'
      }))
    };

    setExtractedData(aggregated);
    setStep('preview');
  }, []);

  const handleApply = useCallback((selectedData) => {
    const { importMode = 'add' } = selectedData;
    const updates = {};

    // Colors - main colors
    if (selectedData.colors) {
      const existingPalette = brand.colors?.palette || [];
      const newPaletteColors = selectedData.paletteColors || [];

      updates.colors = {
        ...brand.colors,
        primary: selectedData.colors.primary || brand.colors.primary,
        secondary: selectedData.colors.secondary || brand.colors.secondary,
        accent: selectedData.colors.accent || brand.colors.accent,
        background: selectedData.colors.background || brand.colors.background,
        text: selectedData.colors.text || brand.colors.text,
        // Merge or replace palette
        palette: importMode === 'add'
          ? [...existingPalette, ...newPaletteColors]
          : newPaletteColors
      };
    }

    // Fonts
    if (selectedData.fonts) {
      const existingAdditional = brand.fonts?.additional || [];
      const newAdditionalFonts = selectedData.additionalFonts || [];

      updates.fonts = {
        ...brand.fonts,
        heading: selectedData.fonts.heading || brand.fonts.heading,
        body: selectedData.fonts.body || brand.fonts.body,
        // Merge or replace additional fonts
        additional: importMode === 'add'
          ? [...existingAdditional, ...newAdditionalFonts]
          : newAdditionalFonts
      };
    }

    // Logo - primary logo
    if (selectedData.logo) {
      updates.logo = selectedData.logo;
    }

    // Additional logos
    const existingLogos = brand.logos || [];
    const newAdditionalLogos = selectedData.additionalLogos || [];

    if (newAdditionalLogos.length > 0 || importMode === 'replace') {
      updates.logos = importMode === 'add'
        ? [...existingLogos, ...newAdditionalLogos]
        : newAdditionalLogos;
    }

    // Tone of Voice
    if (selectedData.toneOfVoice) {
      updates.toneOfVoice = selectedData.toneOfVoice;
    }

    // Update brand in store
    updateBrand(brandId, updates);

    // Navigate to brand overview or assets
    navigate(`/brand/${brandId}`);
  }, [brandId, brand, updateBrand, navigate]);

  const handleCancel = useCallback(() => {
    setStep('upload');
    setExtractedData(null);
  }, []);

  if (!brand) {
    return <div className="not-found">Marke nicht gefunden</div>;
  }

  return (
    <div className="brand-intelligence">
      <header className="page-header">
        <div className="page-header-content">
          <h1>Brand importieren</h1>
          <p className="page-subtitle">
            {step === 'upload' && 'Lade Brand-Dokumente hoch (PDF, PPTX, Bilder)'}
            {step === 'analyzing' && 'Extrahiere Brand-Elemente...'}
            {step === 'preview' && 'Wähle die Elemente aus, die du übernehmen möchtest'}
          </p>
        </div>
      </header>

      <div className="intelligence-content">
        {error && (
          <div className="intelligence-error">
            <span className="error-icon">!</span>
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {step === 'upload' && (
          <AnalyzerUpload
            onStartAnalysis={handleStartAnalysis}
            onFigmaAnalysis={handleFigmaAnalysis}
          />
        )}

        {step === 'analyzing' && (
          <AnalysisProgress
            progress={progress}
            message={progressMessage}
          />
        )}

        {step === 'preview' && extractedData && (
          <BrandPreview
            extractedData={extractedData}
            existingBrand={brand}
            onApply={handleApply}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}
