// ============================================
// EXPORT HUB - Zentraler Export-Manager
// ============================================
import { brandToTokens, tokensToCss, tokensToTailwind, tokensToJson } from '../tokens.js';
import { generatePptx, downloadPptx } from './pptx.js';
import { generateFlyerPdf, generateBusinessCardPdf, generateGuidelinesPdf, downloadPdf } from './pdf.js';

/**
 * Zentrale Export-Funktion
 * Nimmt Brand + Content und exportiert ins gewünschte Format
 */
export async function exportAsset(brand, content, format, options = {}) {
  const tokens = brandToTokens(brand);
  
  switch (format) {
    // Design Tokens
    case 'tokens-json':
      return downloadJson(tokensToJson(tokens), `${brand.name}-tokens.json`);
    
    case 'tokens-css':
      return downloadText(tokensToCss(tokens), `${brand.name}-tokens.css`);
    
    case 'tokens-tailwind':
      return downloadText(tokensToTailwind(tokens), `tailwind.config.js`);
    
    // PowerPoint
    case 'pptx':
      const pptx = await generatePptx(tokens, content, options);
      return downloadPptx(pptx, `${brand.name}-presentation.pptx`);
    
    // PDF
    case 'pdf-flyer':
      const flyerPdf = await generateFlyerPdf(tokens, content, options);
      return downloadPdf(flyerPdf, `${brand.name}-flyer.pdf`);
    
    case 'pdf-businesscard':
      const cardPdf = await generateBusinessCardPdf(tokens, content, options);
      return downloadPdf(cardPdf, `${brand.name}-visitenkarte.pdf`);
    
    case 'pdf-guidelines':
      const guidelinesPdf = await generateGuidelinesPdf(tokens, options);
      return downloadPdf(guidelinesPdf, `${brand.name}-brand-guidelines.pdf`);
    
    // HTML (für Newsletter, Website-Snippets)
    case 'html-email':
      const emailHtml = generateEmailHtml(tokens, content);
      return downloadText(emailHtml, `${brand.name}-newsletter.html`);
    
    case 'html-hero':
      const heroHtml = generateHeroHtml(tokens, content);
      return downloadText(heroHtml, `${brand.name}-hero.html`);
    
    // Brand Package (ZIP mit allem)
    case 'brand-package':
      return exportBrandPackage(brand, tokens);
    
    default:
      throw new Error(`Unbekanntes Export-Format: ${format}`);
  }
}

/**
 * Generiert Newsletter-HTML
 */
function generateEmailHtml(tokens, content) {
  const fields = content.fields || {};
  
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fields.subject?.value || 'Newsletter'}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: ${tokens.typography.body.fontFamily};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: ${tokens.colors.primary.value}; padding: 30px; text-align: center;">
              ${tokens.assets.logo ? `<img src="${tokens.assets.logo}" alt="${tokens.meta.name}" style="max-height: 50px; width: auto;">` : `<span style="color: white; font-size: 24px; font-weight: bold;">${tokens.meta.name}</span>`}
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="margin: 0 0 20px; font-family: ${tokens.typography.heading.fontFamily}; font-size: 28px; color: ${tokens.colors.text.value};">
                ${fields.subject?.value || 'Newsletter Titel'}
              </h1>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: ${tokens.colors.text.value};">
                ${fields.greeting?.value || 'Hallo,'}
              </p>
              
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: ${tokens.colors.text.value};">
                ${fields.body?.value || 'Ihr Newsletter-Inhalt hier...'}
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: ${tokens.colors.primary.value}; border-radius: 6px;">
                    <a href="${fields.ctaUrl?.value || '#'}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">
                      ${fields.cta?.value || 'Mehr erfahren'}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 20px 30px; text-align: center; font-size: 12px; color: #666666;">
              <p style="margin: 0;">
                © ${new Date().getFullYear()} ${tokens.meta.name} | 
                <a href="#" style="color: ${tokens.colors.primary.value};">Impressum</a> | 
                <a href="#" style="color: ${tokens.colors.primary.value};">Abmelden</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generiert Hero-Section HTML
 */
function generateHeroHtml(tokens, content) {
  const fields = content.fields || {};
  
  return `<!-- ${tokens.meta.name} Hero Section -->
<section style="
  background-color: ${tokens.colors.background.value};
  padding: 80px 40px;
  font-family: ${tokens.typography.body.fontFamily};
">
  <div style="max-width: 1200px; margin: 0 auto;">
    
    <h1 style="
      font-family: ${tokens.typography.heading.fontFamily};
      font-size: 48px;
      font-weight: 700;
      color: ${tokens.colors.text.value};
      margin: 0 0 24px;
      line-height: 1.1;
    ">
      ${fields.headline?.value || tokens.voice.tagline || 'Ihre Headline hier'}
    </h1>
    
    <p style="
      font-size: 20px;
      color: ${tokens.colors.text.value};
      opacity: 0.8;
      margin: 0 0 32px;
      max-width: 600px;
      line-height: 1.6;
    ">
      ${fields.subline?.value || 'Überzeugende Beschreibung Ihrer Marke.'}
    </p>
    
    <a href="#" style="
      display: inline-block;
      background-color: ${tokens.colors.primary.value};
      color: #ffffff;
      padding: 16px 32px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 8px;
      transition: opacity 0.2s;
    ">
      ${fields.cta?.value || 'Mehr erfahren'}
    </a>
    
  </div>
</section>

<!-- CSS Variables für einfache Integration -->
<style>
${tokensToCss(tokens)}
</style>`;
}

/**
 * Exportiert komplettes Brand-Package als ZIP
 */
async function exportBrandPackage(brand, tokens) {
  // Hinweis: Für ZIP-Export brauchen wir JSZip
  // Hier erstellen wir erstmal die einzelnen Dateien
  const files = {
    'tokens.json': tokensToJson(tokens),
    'tokens.css': tokensToCss(tokens),
    'tailwind.config.js': tokensToTailwind(tokens),
    'README.md': generateReadme(brand, tokens)
  };
  
  // Einzeln downloaden (später mit JSZip als ZIP)
  for (const [filename, content] of Object.entries(files)) {
    downloadText(content, filename);
    await new Promise(resolve => setTimeout(resolve, 500)); // Kurze Pause zwischen Downloads
  }
}

/**
 * Generiert README für Brand-Package
 */
function generateReadme(brand, tokens) {
  return `# ${brand.name} - Brand Assets

Generiert mit Brand Engine am ${new Date().toLocaleDateString('de-DE')}

## Farben

| Name | Hex | Verwendung |
|------|-----|------------|
| Primary | ${tokens.colors.primary.value} | CTAs, Links, Akzente |
| Secondary | ${tokens.colors.secondary.value} | Hintergründe, Hover |
| Accent | ${tokens.colors.accent.value} | Highlights, Badges |
| Background | ${tokens.colors.background.value} | Haupthintergrund |
| Text | ${tokens.colors.text.value} | Fließtext |

## Typografie

- **Überschriften:** ${tokens.typography.heading.fontFamilyClean}
- **Fließtext:** ${tokens.typography.body.fontFamilyClean}

## Tonalität

- **Stil:** ${tokens.voice.tone}
- **Ansprache:** ${tokens.voice.formality === 'du' ? 'Du (informell)' : tokens.voice.formality === 'sie' ? 'Sie (formell)' : 'Wir (inklusiv)'}
- **Tagline:** ${tokens.voice.tagline || '-'}

## Dateien

- \`tokens.json\` - Design Tokens im JSON-Format
- \`tokens.css\` - CSS Custom Properties
- \`tailwind.config.js\` - Tailwind CSS Konfiguration

## Verwendung

### CSS Variables
\`\`\`css
@import 'tokens.css';

.button {
  background: var(--color-primary);
  font-family: var(--font-body);
}
\`\`\`

### Tailwind
\`\`\`javascript
// tailwind.config.js einbinden
import brandConfig from './tailwind.config.js';
\`\`\`
`;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function downloadText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
}

function downloadJson(content, filename) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
}

// Export-Optionen für UI
export const exportFormats = [
  { 
    id: 'tokens-css', 
    name: 'CSS Variables', 
    icon: '🎨', 
    category: 'tokens',
    description: 'Design Tokens als CSS Custom Properties'
  },
  { 
    id: 'tokens-tailwind', 
    name: 'Tailwind Config', 
    icon: '🌊', 
    category: 'tokens',
    description: 'Fertige Tailwind-Konfiguration'
  },
  { 
    id: 'tokens-json', 
    name: 'JSON Tokens', 
    icon: '📦', 
    category: 'tokens',
    description: 'Für Figma, Style Dictionary, etc.'
  },
  { 
    id: 'pptx', 
    name: 'PowerPoint', 
    icon: '📊', 
    category: 'documents',
    description: 'Editierbare .pptx Datei'
  },
  { 
    id: 'pdf-flyer', 
    name: 'Flyer (PDF)', 
    icon: '📄', 
    category: 'documents',
    description: 'Druckfertiger Flyer'
  },
  { 
    id: 'pdf-businesscard', 
    name: 'Visitenkarte (PDF)', 
    icon: '💳', 
    category: 'documents',
    description: 'Vorder- und Rückseite'
  },
  { 
    id: 'pdf-guidelines', 
    name: 'Brand Guidelines', 
    icon: '📋', 
    category: 'documents',
    description: 'Komplettes Markenhandbuch'
  },
  { 
    id: 'html-email', 
    name: 'Newsletter HTML', 
    icon: '✉️', 
    category: 'web',
    description: 'E-Mail-kompatibles HTML'
  },
  { 
    id: 'html-hero', 
    name: 'Hero Section', 
    icon: '🌐', 
    category: 'web',
    description: 'Copy-Paste HTML + CSS'
  },
  { 
    id: 'brand-package', 
    name: 'Brand Package', 
    icon: '📁', 
    category: 'all',
    description: 'Alle Tokens + README'
  }
];

export default exportAsset;
