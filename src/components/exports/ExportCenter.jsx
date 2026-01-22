import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBrandStore } from '../../stores/brandStore';
import { exportFigmaVariables } from '../../lib/exporters/figma';
import { exportPptxTheme } from '../../lib/exporters/pptx-theme';
import { exportPrintSpecs } from '../../lib/exporters/print-specs';
import { exportAsset } from '../../lib/exporters';

const exportPresets = [
  {
    id: 'developer',
    name: 'Developer Kit',
    description: 'CSS, Tailwind Config, JSON Tokens',
    icon: '{ }',
    formats: ['tokens-css', 'tokens-tailwind', 'tokens-json']
  },
  {
    id: 'design',
    name: 'Design Handoff',
    description: 'Figma Variables, JSON, Guidelines PDF',
    icon: '◇',
    formats: ['figma-variables', 'tokens-json', 'pdf-guidelines']
  },
  {
    id: 'microsoft',
    name: 'Microsoft Kit',
    description: 'PowerPoint Theme, Template Präsentation',
    icon: 'P',
    formats: ['pptx-theme', 'pptx']
  },
  {
    id: 'print',
    name: 'Print Package',
    description: 'CMYK Specs, Brand Guidelines',
    icon: '⎙',
    formats: ['print-specs', 'pdf-guidelines']
  },
  {
    id: 'complete',
    name: 'Complete Package',
    description: 'Alle Formate als ZIP',
    icon: '★',
    formats: ['all']
  }
];

const individualFormats = [
  { id: 'tokens-css', name: 'CSS Variables', category: 'Web', ext: '.css' },
  { id: 'tokens-tailwind', name: 'Tailwind Config', category: 'Web', ext: '.js' },
  { id: 'tokens-json', name: 'JSON Tokens', category: 'Web', ext: '.json' },
  { id: 'figma-variables', name: 'Figma Variables', category: 'Design', ext: '.json' },
  { id: 'pptx-theme', name: 'PowerPoint Theme', category: 'Microsoft', ext: '.thmx' },
  { id: 'pptx', name: 'PowerPoint Template', category: 'Microsoft', ext: '.pptx' },
  { id: 'print-specs', name: 'Print Specs (CMYK)', category: 'Print', ext: '.json' },
  { id: 'pdf-guidelines', name: 'Brand Guidelines', category: 'Print', ext: '.pdf' },
  { id: 'html-email', name: 'Email Template', category: 'Web', ext: '.html' },
];

export default function ExportCenter() {
  const { brandId } = useParams();
  const { getBrandById } = useBrandStore();
  const brand = getBrandById(brandId);
  const [exporting, setExporting] = useState(null);
  const [exportLog, setExportLog] = useState([]);

  if (!brand) {
    return <div className="not-found">Marke nicht gefunden</div>;
  }

  const addLog = (message, type = 'info') => {
    setExportLog(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
  };

  const handlePresetExport = async (preset) => {
    setExporting(preset.id);
    addLog(`Starting ${preset.name} export...`);

    try {
      if (preset.id === 'complete') {
        // Export all formats as ZIP
        addLog('Generating complete brand package...');
        await exportCompletePackage(brand);
        addLog('Complete package exported!', 'success');
      } else {
        for (const format of preset.formats) {
          addLog(`Exporting ${format}...`);
          await handleSingleExport(format, false);
        }
        addLog(`${preset.name} completed!`, 'success');
      }
    } catch (error) {
      addLog(`Error: ${error.message}`, 'error');
    }

    setExporting(null);
  };

  const handleSingleExport = async (formatId, showLog = true) => {
    if (showLog) {
      setExporting(formatId);
      addLog(`Exporting ${formatId}...`);
    }

    try {
      let blob, filename;

      switch (formatId) {
        case 'figma-variables':
          const figmaData = exportFigmaVariables(brand);
          blob = new Blob([JSON.stringify(figmaData, null, 2)], { type: 'application/json' });
          filename = `${brand.name}-figma-variables.json`;
          break;

        case 'pptx-theme':
          blob = await exportPptxTheme(brand);
          filename = `${brand.name}-theme.thmx`;
          break;

        case 'print-specs':
          const printData = exportPrintSpecs(brand);
          blob = new Blob([JSON.stringify(printData, null, 2)], { type: 'application/json' });
          filename = `${brand.name}-print-specs.json`;
          break;

        default:
          // Use existing exporters
          const result = await exportAsset(brand, {}, formatId, {});
          if (result instanceof Blob) {
            blob = result;
          } else {
            blob = new Blob([result], { type: 'text/plain' });
          }
          const format = individualFormats.find(f => f.id === formatId);
          filename = `${brand.name}-${formatId}${format?.ext || '.txt'}`;
      }

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      if (showLog) {
        addLog(`${formatId} exported successfully!`, 'success');
      }
    } catch (error) {
      if (showLog) {
        addLog(`Error exporting ${formatId}: ${error.message}`, 'error');
      }
      throw error;
    }

    if (showLog) {
      setExporting(null);
    }
  };

  const exportCompletePackage = async (brand) => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Add all formats
    const figmaData = exportFigmaVariables(brand);
    zip.file('design/figma-variables.json', JSON.stringify(figmaData, null, 2));

    const printData = exportPrintSpecs(brand);
    zip.file('print/print-specs.json', JSON.stringify(printData, null, 2));

    // CSS and Tailwind
    const cssResult = await exportAsset(brand, {}, 'tokens-css', {});
    zip.file('web/tokens.css', cssResult);

    const tailwindResult = await exportAsset(brand, {}, 'tokens-tailwind', {});
    zip.file('web/tailwind.config.js', tailwindResult);

    const jsonResult = await exportAsset(brand, {}, 'tokens-json', {});
    zip.file('tokens.json', jsonResult);

    // README
    zip.file('README.md', generateReadme(brand));

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brand.name}-brand-package.zip`;
    a.click();
  };

  const generateReadme = (brand) => {
    return `# ${brand.name} Brand Package

## Exported from TYRN.ON Brand Engine

### Contents

- \`/design/figma-variables.json\` - Import into Figma as Variables
- \`/print/print-specs.json\` - CMYK color values and print specifications
- \`/web/tokens.css\` - CSS custom properties
- \`/web/tailwind.config.js\` - Tailwind CSS configuration
- \`tokens.json\` - Complete design token JSON

### Colors

| Name | HEX | Usage |
|------|-----|-------|
| Primary | ${brand.colors.primary} | Main brand color |
| Secondary | ${brand.colors.secondary} | Supporting color |
| Accent | ${brand.colors.accent} | CTAs, highlights |
| Background | ${brand.colors.background} | Page backgrounds |
| Text | ${brand.colors.text} | Body text |

### Typography

- **Heading:** ${brand.fonts.heading}
- **Body:** ${brand.fonts.body}

### Brand Voice

- **Tone:** ${brand.voice?.tone || 'Professional'}
- **Formality:** ${brand.voice?.formality || 'Sie'}
${brand.voice?.tagline ? `- **Tagline:** ${brand.voice.tagline}` : ''}

---
Generated with TYRN.ON Brand Engine
`;
  };

  return (
    <div className="export-center">
      <header className="page-header">
        <div className="page-header-content">
          <h1>Export Center</h1>
          <p className="page-subtitle">Exportiere {brand.name} in alle Formate</p>
        </div>
      </header>

      <section className="export-presets">
        <h2>Export Presets</h2>
        <p className="section-description">Schnell-Export für häufige Anwendungsfälle</p>

        <div className="presets-grid">
          {exportPresets.map(preset => (
            <button
              key={preset.id}
              className={`preset-card ${exporting === preset.id ? 'exporting' : ''}`}
              onClick={() => handlePresetExport(preset)}
              disabled={exporting}
            >
              <div className="preset-icon">{preset.icon}</div>
              <div className="preset-content">
                <h3>{preset.name}</h3>
                <p>{preset.description}</p>
              </div>
              {exporting === preset.id && <div className="export-spinner" />}
            </button>
          ))}
        </div>
      </section>

      <section className="export-individual">
        <h2>Einzelne Formate</h2>
        <p className="section-description">Exportiere spezifische Dateien</p>

        <div className="formats-grid">
          {['Web', 'Design', 'Microsoft', 'Print'].map(category => (
            <div key={category} className="format-category">
              <h4>{category}</h4>
              <div className="format-list">
                {individualFormats.filter(f => f.category === category).map(format => (
                  <button
                    key={format.id}
                    className={`format-btn ${exporting === format.id ? 'exporting' : ''}`}
                    onClick={() => handleSingleExport(format.id)}
                    disabled={exporting}
                  >
                    <span className="format-name">{format.name}</span>
                    <span className="format-ext">{format.ext}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {exportLog.length > 0 && (
        <section className="export-log">
          <div className="log-header">
            <h4>Export Log</h4>
            <button onClick={() => setExportLog([])}>Clear</button>
          </div>
          <div className="log-entries">
            {exportLog.map((entry, i) => (
              <div key={i} className={`log-entry ${entry.type}`}>
                <span className="log-time">{entry.time}</span>
                <span className="log-message">{entry.message}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
