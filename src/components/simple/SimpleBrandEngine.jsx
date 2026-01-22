import React, { useState } from 'react';
import UploadStep from './UploadStep';
import GenerateStep from './GenerateStep';
import ResultStep from './ResultStep';

/**
 * SimpleBrandEngine - Radically simplified 3-step brand content generator
 *
 * Flow:
 * 1. Upload - Drag & drop brand PDF/PPTX/logo → AI extracts colors, fonts, voice
 * 2. Generate - Select asset type + optional brief → AI generates content
 * 3. Result - Live preview + export options
 */
export default function SimpleBrandEngine() {
  // Current step: 'upload' | 'generate' | 'result'
  const [step, setStep] = useState('upload');

  // Brand data extracted from uploaded documents
  const [brand, setBrand] = useState({
    name: 'Meine Marke',
    colors: {
      primary: '#6366f1',
      secondary: '#4f46e5',
      accent: '#ec4899',
      background: '#ffffff',
      text: '#1f2937'
    },
    fonts: {
      heading: "'DM Sans', sans-serif",
      body: "'Inter', sans-serif"
    },
    voice: {
      tone: 'professional',
      formality: 'sie',
      tagline: ''
    },
    logo: null,
    toneOfVoice: null
  });

  // Selected asset type and briefing
  const [assetType, setAssetType] = useState('website');
  const [briefing, setBriefing] = useState('');

  // Generated content and preview data
  const [generatedContent, setGeneratedContent] = useState(null);

  // Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Step 1: Handle upload completion
  const handleAnalysisComplete = (extractedBrand) => {
    setBrand(prev => ({
      ...prev,
      ...extractedBrand,
      colors: { ...prev.colors, ...extractedBrand.colors },
      fonts: { ...prev.fonts, ...extractedBrand.fonts },
      voice: { ...prev.voice, ...extractedBrand.voice }
    }));
    setStep('generate');
    setError(null);
  };

  // Step 2: Handle content generation complete
  const handleGenerationComplete = (content) => {
    setGeneratedContent(content);
    setStep('result');
    setError(null);
  };

  // Navigation helpers
  const goToUpload = () => {
    setStep('upload');
    setGeneratedContent(null);
  };

  const goToGenerate = () => {
    setStep('generate');
    setGeneratedContent(null);
  };

  const handleNewAsset = () => {
    setBriefing('');
    setGeneratedContent(null);
    setStep('generate');
  };

  const handleLogout = () => {
    localStorage.removeItem('brand_engine_auth');
    window.location.reload();
  };

  return (
    <div className="simple-brand-engine">
      {/* Header */}
      <header className="simple-header">
        <div className="simple-logo">Brand Engine</div>
        <div className="simple-steps">
          <span className={`step-indicator ${step === 'upload' ? 'active' : ''} ${step !== 'upload' ? 'done' : ''}`}>
            1. Upload
          </span>
          <span className="step-arrow">→</span>
          <span className={`step-indicator ${step === 'generate' ? 'active' : ''} ${step === 'result' ? 'done' : ''}`}>
            2. Generieren
          </span>
          <span className="step-arrow">→</span>
          <span className={`step-indicator ${step === 'result' ? 'active' : ''}`}>
            3. Ergebnis
          </span>
        </div>
        <button className="btn-logout-simple" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Error Display */}
      {error && (
        <div className="simple-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Main Content */}
      <main className="simple-main">
        {step === 'upload' && (
          <UploadStep
            onComplete={handleAnalysisComplete}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
            setError={setError}
          />
        )}

        {step === 'generate' && (
          <GenerateStep
            brand={brand}
            assetType={assetType}
            setAssetType={setAssetType}
            briefing={briefing}
            setBriefing={setBriefing}
            onComplete={handleGenerationComplete}
            onBack={goToUpload}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            setError={setError}
          />
        )}

        {step === 'result' && (
          <ResultStep
            brand={brand}
            assetType={assetType}
            generatedContent={generatedContent}
            onNewAsset={handleNewAsset}
            onStartOver={goToUpload}
            setError={setError}
          />
        )}
      </main>
    </div>
  );
}
