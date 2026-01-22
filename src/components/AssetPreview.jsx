import React, { useState } from 'react';
import { previewComponents } from './previews/index.jsx';
import AIStudio from './AIStudio';
import ContentEditor from './ContentEditor';
import ImagePicker from './ImagePicker';
import ExportPanel from './ExportPanel';

const assetTypes = [
  { id: 'website', name: 'Website', icon: 'W' },
  { id: 'social', name: 'Social', icon: 'S' },
  { id: 'presentation', name: 'PPT', icon: 'P' },
  { id: 'flyer', name: 'Flyer', icon: 'F' },
  { id: 'email', name: 'E-Mail', icon: 'E' },
  { id: 'businesscard', name: 'Karte', icon: 'K' },
];

export default function AssetPreview({ brand, selectedAsset, onAssetChange, content, onContentChange }) {
  const [activeToolTab, setActiveToolTab] = useState('ai');

  const PreviewComponent = previewComponents[selectedAsset];

  const handleApplyAIContent = (generatedText) => {
    // Parse the generated text and apply to content fields
    const lines = generatedText.split('\n').filter(l => l.trim());
    const headline = lines.find(l => l.includes('Headline') || l.includes('HEADLINE'))?.replace(/.*?[:：]\s*/, '').replace(/\*\*/g, '') || '';

    onContentChange({
      ...content,
      fields: {
        ...content.fields,
        headline: { value: headline || lines[0]?.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '') || '' },
        body: { value: generatedText }
      }
    });
  };

  const toolTabs = [
    { id: 'ai', name: 'AI Studio', icon: '*' },
    { id: 'content', name: 'Inhalt', icon: 'C' },
    { id: 'media', name: 'Medien', icon: 'M' },
    { id: 'export', name: 'Export', icon: 'E' },
  ];

  return (
    <div className="asset-preview-panel">
      <div className="asset-selector">
        {assetTypes.map(asset => (
          <button
            key={asset.id}
            className={selectedAsset === asset.id ? 'active' : ''}
            onClick={() => onAssetChange(asset.id)}
          >
            <span className="asset-icon">{asset.icon}</span>
            <span className="asset-name">{asset.name}</span>
          </button>
        ))}
      </div>

      <div className="preview-workspace">
        <div className="preview-main">
          <div className="preview-container">
            {PreviewComponent && <PreviewComponent brand={brand} content={content} />}
          </div>
        </div>

        <div className="preview-sidebar">
          <div className="tool-tabs">
            {toolTabs.map(tab => (
              <button
                key={tab.id}
                className={`tool-tab ${activeToolTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveToolTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-name">{tab.name}</span>
              </button>
            ))}
          </div>

          <div className="tool-content">
            {activeToolTab === 'ai' && (
              <AIStudio
                brand={brand}
                selectedAsset={selectedAsset}
                onApplyContent={handleApplyAIContent}
              />
            )}

            {activeToolTab === 'content' && (
              <ContentEditor
                assetType={selectedAsset}
                content={content}
                onChange={onContentChange}
                brand={brand}
              />
            )}

            {activeToolTab === 'media' && (
              <div className="media-panel">
                <ImagePicker
                  brand={brand}
                  onSelectImage={(img) => {
                    onContentChange({
                      ...content,
                      fields: {
                        ...content.fields,
                        image: { value: img.url || img }
                      }
                    });
                  }}
                />
              </div>
            )}

            {activeToolTab === 'export' && (
              <ExportPanel brand={brand} content={content} assetType={selectedAsset} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
