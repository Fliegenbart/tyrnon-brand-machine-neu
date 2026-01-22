// ============================================
// AGGREGATOR - Collect and simplify analyzer results
// Prepares data for direct brand import (no rules)
// ============================================

/**
 * Aggregate results from all analyzers into a simple structure
 * for the BrandPreview component
 */
export function aggregateExtraction(analyzerResults) {
  const { pptx = [], pdf = [], images = [], fonts: uploadedFonts = [] } = analyzerResults;

  const allColors = [];
  const allFonts = [];
  const allLogos = [];

  // ========== COLORS ==========

  // PPTX Theme colors (highest priority)
  for (const p of pptx) {
    // Theme accent colors
    for (const color of p.theme?.colors || []) {
      if (color.value && isValidHex(color.value)) {
        allColors.push({
          hex: normalizeHex(color.value),
          source: 'pptx-theme',
          name: color.label || color.name,
          priority: color.type === 'accent' ? 15 : 10
        });
      }
    }

    // Colors from slide usage
    for (const [hex, data] of Object.entries(p.patterns?.colorUsage || {})) {
      if (isValidHex(hex) && !isNearWhiteOrBlack(hex)) {
        allColors.push({
          hex: normalizeHex(hex),
          source: 'pptx-slides',
          priority: Math.min(data.frequency || 1, 10)
        });
      }
    }
  }

  // PDF colors
  for (const p of pdf) {
    for (const color of p.colors?.dominant || []) {
      if (color.hex && isValidHex(color.hex) && !isNearWhiteOrBlack(color.hex)) {
        allColors.push({
          hex: normalizeHex(color.hex),
          source: 'pdf',
          priority: Math.min(color.count || 1, 8)
        });
      }
    }

    // Accent colors from PDF
    for (const color of p.colors?.accent || []) {
      if (color.hex && isValidHex(color.hex)) {
        allColors.push({
          hex: normalizeHex(color.hex),
          source: 'pdf-accent',
          priority: 6
        });
      }
    }
  }

  // Image/Logo colors
  for (const img of images) {
    if (img.properties?.isLikelyLogo) {
      for (const color of img.colors?.dominant || []) {
        if (color.hex && isValidHex(color.hex) && !isNearWhiteOrBlack(color.hex)) {
          allColors.push({
            hex: normalizeHex(color.hex),
            source: 'logo',
            priority: 12 // Logo colors are important
          });
        }
      }
    }
  }

  // Deduplicate and sort colors
  const uniqueColors = deduplicateColors(allColors);

  // ========== FONTS ==========

  // Fonts from PPTX theme
  for (const p of pptx) {
    if (p.theme?.fonts?.major) {
      allFonts.push({
        name: p.theme.fonts.major,
        usage: 'heading',
        source: 'pptx-theme',
        priority: 10
      });
    }
    if (p.theme?.fonts?.minor) {
      allFonts.push({
        name: p.theme.fonts.minor,
        usage: 'body',
        source: 'pptx-theme',
        priority: 10
      });
    }

    // Additional fonts from theme
    for (const font of p.theme?.fonts?.all || []) {
      if (font.name && !allFonts.find(f => f.name === font.name)) {
        allFonts.push({
          name: font.name,
          usage: font.usage || 'unknown',
          source: 'pptx',
          priority: 5
        });
      }
    }
  }

  // Uploaded font files
  for (const font of uploadedFonts) {
    if (font.name) {
      allFonts.push({
        name: font.name,
        usage: 'uploaded',
        source: 'upload',
        dataUrl: font.dataUrl,
        priority: 15 // User-uploaded fonts are high priority
      });
    }
  }

  // Deduplicate fonts
  const uniqueFonts = deduplicateFonts(allFonts);

  // ========== LOGOS ==========

  // Logos from PPTX
  for (const p of pptx) {
    for (const logo of p.extractedAssets?.logos || []) {
      if (logo.dataUrl || logo.data) {
        allLogos.push({
          dataUrl: logo.dataUrl || logo.data,
          name: logo.name || 'Logo',
          source: 'pptx',
          confidence: logo.confidence || 0.8
        });
      }
    }
  }

  // Images identified as logos
  for (const img of images) {
    if (img.properties?.isLikelyLogo && img.dataUrl) {
      allLogos.push({
        dataUrl: img.dataUrl,
        name: img.source || 'Logo',
        source: 'image',
        confidence: img.confidence || 0.7
      });
    }
  }

  // Sort logos by confidence
  allLogos.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  return {
    colors: uniqueColors.slice(0, 10),  // Max 10 colors
    fonts: uniqueFonts.slice(0, 4),      // Max 4 fonts
    logos: allLogos.slice(0, 5)          // Max 5 logos
  };
}

/**
 * Deduplicate colors by similarity and merge priorities
 */
function deduplicateColors(colors) {
  const unique = [];

  for (const color of colors) {
    const similar = unique.find(c => colorDistance(c.hex, color.hex) < 15);

    if (similar) {
      // Merge: keep higher priority, combine names
      similar.priority = Math.max(similar.priority || 0, color.priority || 0);
      if (color.name && !similar.name) {
        similar.name = color.name;
      }
    } else {
      unique.push({ ...color });
    }
  }

  // Sort by priority (higher first)
  unique.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  return unique;
}

/**
 * Deduplicate fonts by name
 */
function deduplicateFonts(fonts) {
  const unique = [];
  const seen = new Set();

  for (const font of fonts) {
    const key = font.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(font);
    }
  }

  // Sort by priority
  unique.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  return unique;
}

/**
 * Normalize hex color to uppercase with #
 */
function normalizeHex(hex) {
  if (!hex) return null;
  hex = hex.trim();
  if (!hex.startsWith('#')) {
    hex = '#' + hex;
  }
  return hex.toUpperCase();
}

/**
 * Check if hex is valid
 */
function isValidHex(hex) {
  if (!hex) return false;
  const clean = hex.replace('#', '');
  return /^[0-9A-Fa-f]{6}$/.test(clean);
}

/**
 * Check if color is near white or black (should be filtered)
 */
function isNearWhiteOrBlack(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return true;

  const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  return luminance < 25 || luminance > 235;
}

/**
 * Calculate color distance (simple RGB euclidean)
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
  if (!hex) return null;
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export default aggregateExtraction;
