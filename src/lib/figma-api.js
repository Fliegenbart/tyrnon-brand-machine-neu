// ============================================
// FIGMA API SERVICE
// Extracts colors, fonts, styles, and assets from Figma files
// ============================================

const FIGMA_API_BASE = 'https://api.figma.com/v1';

/**
 * Get stored Figma API token
 */
export function getFigmaToken() {
  return localStorage.getItem('figma_api_token') || null;
}

/**
 * Save Figma API token
 */
export function setFigmaToken(token) {
  if (token) {
    localStorage.setItem('figma_api_token', token);
  } else {
    localStorage.removeItem('figma_api_token');
  }
}

/**
 * Extract file key from Figma URL
 * Supports: https://www.figma.com/file/XXXX/... or https://www.figma.com/design/XXXX/...
 */
export function extractFileKey(url) {
  const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Fetch Figma file data
 */
export async function fetchFigmaFile(fileKey, token) {
  const response = await fetch(`${FIGMA_API_BASE}/files/${fileKey}`, {
    headers: {
      'X-Figma-Token': token
    }
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Ungültiger API Token oder keine Berechtigung für diese Datei');
    }
    if (response.status === 404) {
      throw new Error('Figma-Datei nicht gefunden');
    }
    throw new Error(`Figma API Fehler: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch file styles (colors, text styles, effects)
 */
export async function fetchFigmaStyles(fileKey, token) {
  const response = await fetch(`${FIGMA_API_BASE}/files/${fileKey}/styles`, {
    headers: {
      'X-Figma-Token': token
    }
  });

  if (!response.ok) {
    console.warn('Could not fetch styles:', response.status);
    return { meta: { styles: [] } };
  }

  return response.json();
}

/**
 * Export images from Figma file
 */
export async function exportFigmaImages(fileKey, nodeIds, token, format = 'svg', scale = 1) {
  if (!nodeIds || nodeIds.length === 0) return {};

  const ids = nodeIds.join(',');
  const response = await fetch(
    `${FIGMA_API_BASE}/images/${fileKey}?ids=${ids}&format=${format}&scale=${scale}`,
    {
      headers: {
        'X-Figma-Token': token
      }
    }
  );

  if (!response.ok) {
    console.warn('Could not export images:', response.status);
    return { images: {} };
  }

  return response.json();
}

/**
 * Analyze a Figma file and extract brand assets
 */
export async function analyzeFigmaFile(url, onProgress = () => {}) {
  const token = getFigmaToken();
  if (!token) {
    throw new Error('Kein Figma API Token gespeichert. Bitte zuerst Token eingeben.');
  }

  const fileKey = extractFileKey(url);
  if (!fileKey) {
    throw new Error('Ungültige Figma URL. Bitte eine gültige Figma-Datei-URL eingeben.');
  }

  onProgress(10, 'Lade Figma-Datei...');

  // Fetch file data
  const fileData = await fetchFigmaFile(fileKey, token);

  onProgress(30, 'Analysiere Styles...');

  // Fetch styles
  const stylesData = await fetchFigmaStyles(fileKey, token);

  onProgress(50, 'Extrahiere Farben und Fonts...');

  // Extract data
  const analysis = {
    source: url,
    fileName: fileData.name,
    lastModified: fileData.lastModified,
    version: fileData.version,

    // Extracted data
    colors: [],
    fonts: [],
    textStyles: [],
    effectStyles: [],
    components: [],
    logos: [],

    confidence: 0.95 // High confidence for direct Figma data
  };

  // Process document styles from file data
  if (fileData.styles) {
    for (const [nodeId, style] of Object.entries(fileData.styles)) {
      processStyle(style, nodeId, analysis);
    }
  }

  // Process local styles
  processLocalStyles(fileData.document, analysis);

  onProgress(70, 'Suche Logos und Assets...');

  // Find logo candidates (frames/components named "logo")
  const logoNodes = findLogoNodes(fileData.document);

  if (logoNodes.length > 0) {
    onProgress(80, 'Exportiere Logos...');

    // Export logos as SVG
    const nodeIds = logoNodes.map(n => n.id);
    const images = await exportFigmaImages(fileKey, nodeIds, token, 'svg');

    if (images.images) {
      for (const node of logoNodes) {
        if (images.images[node.id]) {
          analysis.logos.push({
            name: node.name,
            nodeId: node.id,
            url: images.images[node.id],
            type: 'svg',
            source: 'figma'
          });
        }
      }
    }
  }

  onProgress(90, 'Finalisiere Analyse...');

  // Deduplicate colors
  analysis.colors = deduplicateColors(analysis.colors);

  // Sort by usage/importance
  analysis.colors.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  analysis.fonts.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

  onProgress(100, 'Fertig!');

  return analysis;
}

/**
 * Process a Figma style
 */
function processStyle(style, nodeId, analysis) {
  if (style.styleType === 'FILL') {
    // Color style - actual color values are in the document
    analysis.colors.push({
      name: style.name,
      nodeId,
      description: style.description,
      source: 'style'
    });
  } else if (style.styleType === 'TEXT') {
    analysis.textStyles.push({
      name: style.name,
      nodeId,
      description: style.description
    });
  } else if (style.styleType === 'EFFECT') {
    analysis.effectStyles.push({
      name: style.name,
      nodeId,
      description: style.description
    });
  }
}

/**
 * Recursively process document to find colors, fonts, and components
 */
function processLocalStyles(node, analysis, depth = 0) {
  if (!node) return;

  // Limit recursion depth for performance
  if (depth > 50) return;

  // Extract fills (colors)
  if (node.fills && Array.isArray(node.fills)) {
    for (const fill of node.fills) {
      if (fill.type === 'SOLID' && fill.color) {
        const hex = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
        const existing = analysis.colors.find(c => c.value === hex);
        if (existing) {
          existing.usageCount = (existing.usageCount || 0) + 1;
        } else {
          analysis.colors.push({
            value: hex,
            opacity: fill.color.a !== undefined ? fill.color.a : 1,
            usageCount: 1,
            source: 'fill'
          });
        }
      }
    }
  }

  // Extract text styles and fonts
  if (node.type === 'TEXT' && node.style) {
    const fontFamily = node.style.fontFamily;
    if (fontFamily) {
      const existing = analysis.fonts.find(f => f.name === fontFamily);
      if (existing) {
        existing.usageCount = (existing.usageCount || 0) + 1;
        if (node.style.fontWeight && !existing.weights.includes(node.style.fontWeight)) {
          existing.weights.push(node.style.fontWeight);
        }
      } else {
        analysis.fonts.push({
          name: fontFamily,
          weights: node.style.fontWeight ? [node.style.fontWeight] : [],
          usageCount: 1,
          fontSize: node.style.fontSize,
          lineHeight: node.style.lineHeightPx
        });
      }
    }
  }

  // Track components
  if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
    analysis.components.push({
      id: node.id,
      name: node.name,
      type: node.type,
      description: node.description
    });
  }

  // Recurse into children
  if (node.children) {
    for (const child of node.children) {
      processLocalStyles(child, analysis, depth + 1);
    }
  }
}

/**
 * Find nodes that are likely logos
 */
function findLogoNodes(node, results = [], depth = 0) {
  if (!node || depth > 20) return results;

  const name = (node.name || '').toLowerCase();

  // Check if this looks like a logo
  if (
    (name.includes('logo') || name.includes('brand') || name.includes('mark')) &&
    (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'GROUP' || node.type === 'VECTOR')
  ) {
    results.push({
      id: node.id,
      name: node.name,
      type: node.type
    });
  }

  // Recurse
  if (node.children) {
    for (const child of node.children) {
      findLogoNodes(child, results, depth + 1);
    }
  }

  return results;
}

/**
 * Convert RGB (0-1) to hex
 */
function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

/**
 * Deduplicate colors by similarity
 */
function deduplicateColors(colors) {
  const unique = [];

  for (const color of colors) {
    if (!color.value) continue;

    // Check if similar color exists
    const similar = unique.find(c => c.value && colorDistance(c.value, color.value) < 10);

    if (similar) {
      similar.usageCount = (similar.usageCount || 0) + (color.usageCount || 1);
      if (color.name && !similar.name) {
        similar.name = color.name;
      }
    } else {
      unique.push(color);
    }
  }

  return unique;
}

/**
 * Calculate color distance (simple RGB distance)
 */
function colorDistance(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return Infinity;

  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export default {
  getFigmaToken,
  setFigmaToken,
  extractFileKey,
  analyzeFigmaFile
};
