import React, { useState, useEffect } from 'react';
import './styles.css';

// Simple Mode (default)
import SimpleBrandEngine from './components/simple/SimpleBrandEngine';

// Pro Mode Components
import LoginScreen from './components/LoginScreen';
import BrandSidebar from './components/BrandSidebar';
import BrandEditor from './components/BrandEditor';
import AssetPreview from './components/AssetPreview';
import BrandImport from './components/BrandImport';
import PresenceIndicator from './components/PresenceIndicator';

// Hooks
import { useRealtimeSync } from './hooks/useRealtimeSync.js';

// Lib imports
import { generateContentWithDefaults } from './lib/content.js';
import { exportAsset } from './lib/exporters/index.js';

// ============================================
// BRAND ENGINE - Multi-Brand Marketing Platform
// ============================================

function BrandEngine() {
  const {
    brands,
    assetContent,
    onlineUsers,
    isLoading,
    isOnline,
    syncError,
    currentUser,
    updateBrand,
    createBrand,
    deleteBrand,
    updateAssetContent,
    trackActivity
  } = useRealtimeSync();

  const [activeBrand, setActiveBrand] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState('website');
  const [showImport, setShowImport] = useState(false);

  // Set active brand when brands load
  useEffect(() => {
    if (brands.length > 0 && !activeBrand) {
      setActiveBrand(brands[0]);
    }
    // Update activeBrand if it was modified by another user
    if (activeBrand) {
      const updated = brands.find(b => b.id === activeBrand.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(activeBrand)) {
        setActiveBrand(updated);
      }
    }
  }, [brands]);

  // Track user activity when they switch brands or assets
  useEffect(() => {
    if (activeBrand) {
      trackActivity(activeBrand.id, selectedAsset);
    }
  }, [activeBrand?.id, selectedAsset, trackActivity]);

  const currentContent = activeBrand
    ? (assetContent[`${activeBrand.id}-${selectedAsset}`] || generateContentWithDefaults(selectedAsset, activeBrand))
    : {};

  const handleUpdateBrand = (updatedBrand) => {
    updateBrand(updatedBrand);
    setActiveBrand(updatedBrand);
  };

  const handleCreateBrand = () => {
    const newBrand = {
      id: Date.now().toString(),
      name: `Marke ${brands.length + 1}`,
      colors: { primary: '#6366f1', secondary: '#4f46e5', accent: '#ec4899', background: '#ffffff', text: '#1f2937' },
      fonts: { heading: "'DM Sans', sans-serif", body: "'Inter', sans-serif" },
      voice: { tone: 'friendly', formality: 'du', tagline: '', dos: '', donts: '' },
      logo: null
    };
    createBrand(newBrand);
    setActiveBrand(newBrand);
  };

  const handleDeleteBrand = (brandId) => {
    if (brands.length <= 1) return;
    deleteBrand(brandId);
    if (activeBrand?.id === brandId) {
      const remaining = brands.filter(b => b.id !== brandId);
      setActiveBrand(remaining[0] || null);
    }
  };

  const handleContentChange = (newContent) => {
    if (activeBrand) {
      updateAssetContent(activeBrand.id, selectedAsset, newContent);
    }
  };

  const handleImportBrand = (importedBrand) => {
    // Remove extractedAssets before saving (too large)
    const { extractedAssets, ...brandToSave } = importedBrand;
    createBrand(brandToSave);
    setActiveBrand(brandToSave);
    setShowImport(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Lade Brandspace...</p>
      </div>
    );
  }

  // No active brand yet
  if (!activeBrand) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Initialisiere...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <BrandSidebar
        brands={brands}
        activeBrand={activeBrand}
        onSelectBrand={setActiveBrand}
        onCreateBrand={handleCreateBrand}
        onDeleteBrand={handleDeleteBrand}
        onUpdateBrand={handleUpdateBrand}
        onlineUsers={onlineUsers}
      />

      <main className="main-content">
        <header className="app-header">
          <div className="header-left">
            <h1 className="current-brand-name">{activeBrand.name}</h1>
            {syncError && (
              <span className="sync-error" title={syncError}>Offline</span>
            )}
            {isOnline && !syncError && (
              <span className="sync-status" title="Mit Cloud verbunden">Sync</span>
            )}
          </div>
          <div className="header-center">
            <PresenceIndicator onlineUsers={onlineUsers} currentUser={currentUser} />
          </div>
          <div className="header-actions">
            <button className="btn-ghost" onClick={() => setShowImport(true)}>
              Import
            </button>
            <button className="btn-ghost" onClick={() => exportAsset(activeBrand, currentContent, 'pdf-guidelines')}>
              Guidelines
            </button>
            <button className="btn-logout" onClick={() => { localStorage.removeItem('brand_engine_auth'); window.location.reload(); }}>
              Logout
            </button>
          </div>
        </header>

        <div className="workspace">
          <BrandEditor brand={activeBrand} onUpdate={handleUpdateBrand} />
          <AssetPreview
            brand={activeBrand}
            selectedAsset={selectedAsset}
            onAssetChange={setSelectedAsset}
            content={currentContent}
            onContentChange={handleContentChange}
          />
        </div>
      </main>

      {showImport && (
        <BrandImport
          onImport={handleImportBrand}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}

// ============================================
// ROOT
// ============================================
export default function App() {
  const [isAuth, setIsAuth] = useState(() => localStorage.getItem('brand_engine_auth') === 'true');

  if (!isAuth) return <LoginScreen onLogin={() => setIsAuth(true)} />;

  // Always use Simple Mode (3-step AI-driven flow)
  return <SimpleBrandEngine />;
}
