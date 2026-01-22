import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBrandStore } from '../../stores/brandStore';
import ColorEditor from './ColorEditor';
import TypographyEditor from './TypographyEditor';
import VoiceEditor from './VoiceEditor';
import TokenPreview from './TokenPreview';

const tabs = [
  { id: 'colors', label: 'Farben', icon: '🎨' },
  { id: 'typography', label: 'Typografie', icon: 'Aa' },
  { id: 'voice', label: 'Stimme', icon: '💬' },
  { id: 'logo', label: 'Logo', icon: '◇' },
];

export default function TokenSystem() {
  const { brandId } = useParams();
  const { getBrandById, updateBrand } = useBrandStore();
  const brand = getBrandById(brandId);
  const [activeTab, setActiveTab] = useState('colors');
  const [showPreview, setShowPreview] = useState(true);

  if (!brand) {
    return <div className="not-found">Marke nicht gefunden</div>;
  }

  const handleUpdateColors = (colors) => {
    updateBrand(brandId, { colors });
  };

  const handleUpdateFonts = (fonts) => {
    updateBrand(brandId, { fonts });
  };

  const handleUpdateVoice = (voice) => {
    updateBrand(brandId, { voice });
  };

  const handleUpdateLogo = (logo) => {
    updateBrand(brandId, { logo });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleUpdateLogo(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="token-system">
      <header className="page-header">
        <div className="page-header-content">
          <h1>Design Tokens</h1>
          <p className="page-subtitle">Master Design System für {brand.name}</p>
        </div>
        <button
          className={`btn-secondary ${showPreview ? 'active' : ''}`}
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? 'Preview ausblenden' : 'Preview anzeigen'}
        </button>
      </header>

      <div className={`token-layout ${showPreview ? 'with-preview' : ''}`}>
        <div className="token-editor">
          <div className="token-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`token-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="token-content">
            {activeTab === 'colors' && (
              <ColorEditor
                colors={brand.colors}
                onChange={handleUpdateColors}
              />
            )}

            {activeTab === 'typography' && (
              <TypographyEditor
                fonts={brand.fonts}
                onChange={handleUpdateFonts}
              />
            )}

            {activeTab === 'voice' && (
              <VoiceEditor
                voice={brand.voice}
                onChange={handleUpdateVoice}
              />
            )}

            {activeTab === 'logo' && (
              <div className="logo-editor">
                <h3>Brand Logo</h3>
                <p className="editor-description">
                  Lade dein Logo hoch (SVG oder PNG empfohlen)
                </p>

                <div className="logo-upload-area">
                  {brand.logo ? (
                    <div className="logo-preview-container">
                      <img src={brand.logo} alt="Logo" className="logo-preview-img" />
                      <button
                        className="btn-secondary"
                        onClick={() => handleUpdateLogo(null)}
                      >
                        Entfernen
                      </button>
                    </div>
                  ) : (
                    <label className="logo-upload-label">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        hidden
                      />
                      <span className="upload-icon">+</span>
                      <span>Logo hochladen</span>
                    </label>
                  )}
                </div>

                <div className="logo-variants">
                  <h4>Empfohlene Varianten</h4>
                  <ul>
                    <li>Primary Logo (Farbe)</li>
                    <li>Logo auf hellem Hintergrund</li>
                    <li>Logo auf dunklem Hintergrund</li>
                    <li>Monochrom / Schwarz-Weiß</li>
                    <li>Icon / Favicon</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {showPreview && (
          <TokenPreview brand={brand} activeTab={activeTab} />
        )}
      </div>
    </div>
  );
}
